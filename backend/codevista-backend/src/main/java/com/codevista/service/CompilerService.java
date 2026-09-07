package com.codevista.service;

import com.codevista.execution.ExecutionTraceService;
import com.codevista.model.ExecutionStep;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CompilerService {

    private static final Pattern COMPILER_ERROR_PATTERN =
            Pattern.compile("Main\\.java:(\\d+)(?::\\d+)?\\s*(error|warning)?\\s*(.*)");

    private final ExecutionTraceService executionTraceService;

    public CompilerService(ExecutionTraceService executionTraceService) {
        this.executionTraceService = executionTraceService;
    }

    public CompilationResult compileCode(String code) {

        Path tempDirectory = null;

        try {
            tempDirectory = Files.createTempDirectory("codevista-");

            Path javaFile = tempDirectory.resolve("Main.java");

            Files.writeString(
                    javaFile,
                    code,
                    StandardCharsets.UTF_8
            );

            // Compile Java code (with -g so the execution tracer can later
            // read local variable names and line numbers from the class file)
            ProcessBuilder compileBuilder = new ProcessBuilder(
                    "javac",
                    "-Xdiags:verbose",
                    "-g",
                    "Main.java"
            );

            compileBuilder.directory(tempDirectory.toFile());
            compileBuilder.redirectErrorStream(true);

            Process compileProcess = compileBuilder.start();

            String compileOutput = readProcessOutput(compileProcess);

            boolean finished = compileProcess.waitFor(
                    15,
                    TimeUnit.SECONDS
            );

            if (!finished) {

                compileProcess.destroyForcibly();

                return new CompilationResult(
                        false,
                        "Compilation timed out.",
                        ""
                );
            }

            if (compileProcess.exitValue() != 0) {

                ParsedError parsed = parseCompilerError(compileOutput);

                return new CompilationResult(
                        false,
                        parsed.formatted,
                        "",
                        parsed.lineNumber,
                        parsed.errorType
                );
            }

            // Run Java program
            ProcessBuilder runBuilder = new ProcessBuilder(
                    "java",
                    "Main"
            );

            runBuilder.directory(tempDirectory.toFile());
            runBuilder.redirectErrorStream(true);

            Process runProcess = runBuilder.start();

            String output = readProcessOutput(runProcess);

            boolean runFinished = runProcess.waitFor(
                    10,
                    TimeUnit.SECONDS
            );

            if (!runFinished) {

                runProcess.destroyForcibly();

                return new CompilationResult(
                        false,
                        "Runtime Error: Program execution timed out (10 second limit).",
                        ""
                );
            }

            if (runProcess.exitValue() != 0) {

                return new CompilationResult(
                        false,
                        "Runtime Error: " + extractRuntimeMessage(output),
                        output
                );
            }

            // Generate a real execution trace (separate, debug-mode relaunch
            // of the same compiled class) so the visualizer can show actual
            // variable/array state rather than a canned demo.
            List<ExecutionStep> steps = List.of();
            boolean truncated = false;

            try {
                ExecutionTraceService.TraceResult traceResult =
                        executionTraceService.trace(tempDirectory, code);
                steps = traceResult.steps;
                truncated = traceResult.truncated;
            } catch (Exception ignored) {
                // Tracing is a best-effort enhancement; a failure here must
                // never break the primary compile/run result.
            }

            return new CompilationResult(
                    true,
                    "Code compiled and executed successfully.",
                    output,
                    steps,
                    truncated
            );

        } catch (Exception e) {

            return new CompilationResult(
                    false,
                    "Server Error: " + e.getMessage(),
                    ""
            );

        } finally {

            if (tempDirectory != null) {

                try {

                    Files.walk(tempDirectory)
                            .sorted(Comparator.reverseOrder())
                            .forEach(path -> {

                                try {
                                    Files.deleteIfExists(path);
                                } catch (Exception ignored) {
                                }

                            });

                } catch (Exception ignored) {
                }
            }
        }
    }

    private ParsedError parseCompilerError(String error) {

        if (error == null || error.isBlank()) {
            return new ParsedError("Compilation failed.", 0, "UNKNOWN");
        }

        String[] lines = error.split("\\R");

        StringBuilder allErrors = new StringBuilder();
        long firstLine = 0;
        String firstErrorType = "UNKNOWN";

        for (String line : lines) {

            Matcher matcher = COMPILER_ERROR_PATTERN.matcher(line);

            if (matcher.find()) {

                long lineNumber = Long.parseLong(matcher.group(1));
                String severity = matcher.group(2);
                String message = matcher.group(3).trim();

                if (firstLine == 0) {
                    firstLine = lineNumber;
                    firstErrorType = classifyError(message);
                }

                if (allErrors.length() > 0) {
                    allErrors.append("\n");
                }

                allErrors.append("Line ")
                        .append(lineNumber)
                        .append(": ")
                        .append(message);
            }
        }

        if (allErrors.length() > 0) {
            return new ParsedError(
                    allErrors.toString(),
                    firstLine,
                    firstErrorType
            );
        }

        // Fallback: try to extract any meaningful info
        for (String line : lines) {
            if (line.contains("error")) {
                return new ParsedError(line.trim(), 0, "UNKNOWN");
            }
        }

        return new ParsedError(error.trim(), 0, "UNKNOWN");
    }

    private String classifyError(String message) {

        if (message == null) return "UNKNOWN";

        String lower = message.toLowerCase();

        if (lower.contains("';' expected")) return "MISSING_SEMICOLON";
        if (lower.contains("cannot find symbol")) return "CANNOT_FIND_SYMBOL";
        if (lower.contains("incompatible types")) return "INCOMPATIBLE_TYPES";
        if (lower.contains("reached end of file")) return "REACHED_END_OF_FILE";
        if (lower.contains("illegal start of expression")) return "ILLEGAL_START";
        if (lower.contains("class, interface, enum")) return "UNEXPECTED_TOKEN";
        if (lower.contains("missing return")) return "MISSING_RETURN";
        if (lower.contains("variable might not have been initialized")) return "UNINITIALIZED_VARIABLE";
        if (lower.contains("non-static method")) return "NON_STATIC_METHOD";
        if (lower.contains("static field")) return "STATIC_FIELD_ACCESS";
        if (lower.contains("array required")) return "ARRAY_REQUIRED";
        if (lower.contains("string cannot be converted")) return "TYPE_MISMATCH";
        if (lower.contains("unclosed")) return "UNCLOSED_BLOCK";
        if (lower.contains("illegal character")) return "ILLEGAL_CHARACTER";
        if (lower.contains("method does not override")) return "OVERRIDE_MISMATCH";

        return "UNKNOWN";
    }

    private String extractRuntimeMessage(String output) {

        if (output == null || output.isBlank()) {
            return "Unknown runtime error.";
        }

        // Extract the exception class and message
        String[] lines = output.split("\\R");
        StringBuilder message = new StringBuilder();

        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty()) continue;

            if (line.contains("Exception") || line.contains("Error")) {
                if (message.length() > 0) {
                    message.append(" ");
                }
                message.append(line);
                break;
            }
        }

        if (message.length() == 0) {
            // Just return the first meaningful line
            for (String line : lines) {
                line = line.trim();
                if (!line.isEmpty()) {
                    return line;
                }
            }
            return "Unknown runtime error.";
        }

        return message.toString();
    }

    private String readProcessOutput(Process process)
            throws Exception {

        StringBuilder output = new StringBuilder();

        try (
                BufferedReader reader =
                        new BufferedReader(
                                new InputStreamReader(
                                        process.getInputStream(),
                                        StandardCharsets.UTF_8
                                )
                        )
        ) {

            String line;

            while ((line = reader.readLine()) != null) {

                output.append(line)
                        .append(System.lineSeparator());
            }
        }

        return output.toString().trim();
    }

    public static class CompilationResult {

        private final boolean success;
        private final String message;
        private final String output;
        private final long lineNumber;
        private final String errorType;
        private final List<ExecutionStep> executionSteps;
        private final boolean executionTraceTruncated;

        public CompilationResult(
                boolean success,
                String message,
                String output
        ) {
            this.success = success;
            this.message = message;
            this.output = output;
            this.lineNumber = 0;
            this.errorType = "UNKNOWN";
            this.executionSteps = List.of();
            this.executionTraceTruncated = false;
        }

        public CompilationResult(
                boolean success,
                String message,
                String output,
                long lineNumber,
                String errorType
        ) {
            this.success = success;
            this.message = message;
            this.output = output;
            this.lineNumber = lineNumber;
            this.errorType = errorType;
            this.executionSteps = List.of();
            this.executionTraceTruncated = false;
        }

        public CompilationResult(
                boolean success,
                String message,
                String output,
                List<ExecutionStep> executionSteps,
                boolean executionTraceTruncated
        ) {
            this.success = success;
            this.message = message;
            this.output = output;
            this.lineNumber = 0;
            this.errorType = "UNKNOWN";
            this.executionSteps = executionSteps != null ? executionSteps : List.of();
            this.executionTraceTruncated = executionTraceTruncated;
        }

        public boolean isSuccess() {
            return success;
        }

        public String getMessage() {
            return message;
        }

        public String getOutput() {
            return output;
        }

        public long getLineNumber() {
            return lineNumber;
        }

        public String getErrorType() {
            return errorType;
        }

        public List<ExecutionStep> getExecutionSteps() {
            return executionSteps;
        }

        public boolean isExecutionTraceTruncated() {
            return executionTraceTruncated;
        }
    }

    private static class ParsedError {

        final String formatted;
        final long lineNumber;
        final String errorType;

        ParsedError(String formatted, long lineNumber, String errorType) {
            this.formatted = formatted;
            this.lineNumber = lineNumber;
            this.errorType = errorType;
        }
    }
}
