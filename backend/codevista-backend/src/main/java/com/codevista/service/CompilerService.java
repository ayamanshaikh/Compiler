package com.codevista.service;

import com.codevista.execution.ExecutionTraceService;
import com.codevista.model.ExecutionStep;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Compiles and executes user-supplied Java code in an isolated temporary
 * directory using real {@code javac}/{@code java} subprocesses.
 *
 * <p>Resource limits are enforced at every layer:
 * <ul>
 *   <li>source code is capped ({@code codevista.execution.max-code-length});</li>
 *   <li>compilation and execution each have their own timeout
 *       ({@code codevista.compilation.timeout-seconds} /
 *       {@code codevista.execution.timeout-seconds});</li>
 *   <li>output is read concurrently with the timeout and capped
 *       ({@code codevista.execution.max-output-length}), so a chatty or
 *       infinite program can neither deadlock the pipe buffer nor exhaust
 *       memory — the subprocess is forcibly destroyed on timeout;</li>
 *   <li>the JVM heap of the user program is bounded
 *       ({@code codevista.execution.java-memory-limit}).</li>
 * </ul>
 *
 * <p>Note: subprocess isolation alone is <b>not</b> a production-grade
 * sandbox — a local filesystem/network is still reachable from user code.
 * For public deployment the execution step must run inside a container or
 * microVM (see README, "Security").
 */
@Service
public class CompilerService {

    private static final Pattern COMPILER_ERROR_PATTERN =
            Pattern.compile("Main\\.java:(\\d+)(?::\\d+)?\\s*(error|warning)?\\s*(.*)");

    private static final Pattern RUNTIME_LINE_PATTERN =
            Pattern.compile("Main\\.java:(\\d+)");

    private static final String OUTPUT_TRUNCATED_MARKER =
            "\n… [output truncated]";

    private final ExecutionTraceService executionTraceService;
    private final int compileTimeoutSeconds;
    private final int runTimeoutSeconds;
    private final int maxCodeLength;
    private final int maxOutputLength;
    private final String javaMemoryLimit;

    public CompilerService(
            ExecutionTraceService executionTraceService,
            @Value("${codevista.compilation.timeout-seconds:15}") int compileTimeoutSeconds,
            @Value("${codevista.execution.timeout-seconds:10}") int runTimeoutSeconds,
            @Value("${codevista.execution.max-code-length:100000}") int maxCodeLength,
            @Value("${codevista.execution.max-output-length:131072}") int maxOutputLength,
            @Value("${codevista.execution.java-memory-limit:256m}") String javaMemoryLimit
    ) {
        this.executionTraceService = executionTraceService;
        this.compileTimeoutSeconds = compileTimeoutSeconds;
        this.runTimeoutSeconds = runTimeoutSeconds;
        this.maxCodeLength = maxCodeLength;
        this.maxOutputLength = maxOutputLength;
        this.javaMemoryLimit = javaMemoryLimit;
    }

    public CompilationResult compileCode(String code) {

        if (code == null || code.trim().isEmpty()) {
            return new CompilationResult(
                    false,
                    "No code provided.",
                    ""
            );
        }

        if (code.length() > maxCodeLength) {
            return new CompilationResult(
                    false,
                    "Source code is too large (maximum "
                            + maxCodeLength + " characters).",
                    ""
            );
        }

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
            // read local variable names and line numbers from the class file).
            ProcessBuilder compileBuilder = new ProcessBuilder(
                    "javac",
                    "-Xdiags:verbose",
                    "-g",
                    "-J-Xmx" + javaMemoryLimit,
                    "Main.java"
            );

            compileBuilder.directory(tempDirectory.toFile());
            compileBuilder.redirectErrorStream(true);

            ProcessOutput compileOut =
                    runAndCapture(compileBuilder, compileTimeoutSeconds);

            if (compileOut.timedOut) {
                return new CompilationResult(
                        false,
                        "Compilation timed out after "
                                + compileTimeoutSeconds + " seconds.",
                        ""
                );
            }

            if (compileOut.exitCode != 0) {
                ParsedError parsed = parseCompilerError(compileOut.text);
                return new CompilationResult(
                        false,
                        parsed.formatted,
                        "",
                        parsed.lineNumber,
                        parsed.errorType
                );
            }

            // Run Java program with a bounded heap.
            ProcessBuilder runBuilder = new ProcessBuilder(
                    "java",
                    "-Xmx" + javaMemoryLimit,
                    "Main"
            );

            runBuilder.directory(tempDirectory.toFile());
            runBuilder.redirectErrorStream(true);

            ProcessOutput runOut =
                    runAndCapture(runBuilder, runTimeoutSeconds);

            if (runOut.timedOut) {
                return new CompilationResult(
                        false,
                        "Runtime Error: Program execution timed out "
                                + "(limit " + runTimeoutSeconds + " seconds).",
                        runOut.text
                );
            }

            if (runOut.exitCode != 0) {
                return new CompilationResult(
                        false,
                        "Runtime Error: " + extractRuntimeMessage(runOut.text),
                        runOut.text,
                        extractRuntimeLine(runOut.text),
                        "RUNTIME"
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
                    runOut.text,
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

    /**
     * Launches a process, reads its merged output concurrently on a daemon
     * thread (so the child can never deadlock on a full pipe buffer), waits
     * up to {@code timeoutSeconds}, and forcibly destroys the process if it
     * does not finish in time. Output is capped to bound memory use.
     */
    private ProcessOutput runAndCapture(ProcessBuilder builder, long timeoutSeconds)
            throws IOException {

        Process process = builder.start();

        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        boolean[] overLimit = { false };

        Thread reader = new Thread(() -> {
            try (InputStream in = process.getInputStream()) {
                byte[] chunk = new byte[8192];
                int n;
                while ((n = in.read(chunk)) != -1) {
                    if (buffer.size() + n > maxOutputLength) {
                        overLimit[0] = true;
                        int room = maxOutputLength - buffer.size();
                        if (room > 0) buffer.write(chunk, 0, room);
                    } else {
                        buffer.write(chunk, 0, n);
                    }
                }
            } catch (Exception ignored) {
                // Stream closed because the process was destroyed — fine.
            }
        }, "codevista-process-reader");
        reader.setDaemon(true);
        reader.start();

        boolean finished;
        try {
            finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            process.destroyForcibly();
            throw new IOException("Interrupted while waiting for subprocess", e);
        }

        if (!finished) {
            process.destroyForcibly();
            try {
                process.waitFor(2, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        try {
            reader.join(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        String text = buffer.toString(StandardCharsets.UTF_8).trim();
        if (overLimit[0]) {
            text += OUTPUT_TRUNCATED_MARKER;
        }

        return new ProcessOutput(text, finished ? process.exitValue() : -1, !finished);
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

        // ── Methods & constructors ─────────────────────────────────────
        // Constructor messages also contain "cannot be applied", so they
        // must be checked before the generic method rule.
        if (lower.contains("no suitable constructor found")) return "CONSTRUCTOR_MISMATCH";
        if (lower.contains("constructor") && lower.contains("cannot be applied")) return "CONSTRUCTOR_MISMATCH";
        if (lower.contains("cannot find constructor")) return "CONSTRUCTOR_NOT_FOUND";
        if (lower.contains("cannot be applied to given types")) return "METHOD_ARGUMENT_MISMATCH";
        if (lower.contains("no suitable method found")) return "NO_SUITABLE_METHOD";
        if (lower.contains("missing return")) return "MISSING_RETURN";
        if (lower.contains("non-static method")) return "NON_STATIC_METHOD";

        // ── Generics & lambdas ─────────────────────────────────────────
        if (lower.contains("inference variable")) return "GENERIC_INFERENCE";
        if (lower.contains("type argument")) return "GENERIC_TYPE_ARGUMENT";
        if (lower.contains("not a functional interface")) return "NOT_FUNCTIONAL_INTERFACE";

        // ── Inheritance & OOP ──────────────────────────────────────────
        if (lower.contains("is not abstract and does not override")) return "ABSTRACT_NOT_IMPLEMENTED";
        if (lower.contains("cannot override")) return "CANNOT_OVERRIDE";
        if (lower.contains("method does not override")) return "OVERRIDE_MISMATCH";

        // ── Scope & statics ────────────────────────────────────────────
        if (lower.contains("referenced from a static context")) return "STATIC_CONTEXT_REFERENCE";
        if (lower.contains("non-static variable")) return "STATIC_CONTEXT_REFERENCE";
        if (lower.contains("static field")) return "STATIC_FIELD_ACCESS";
        if (lower.contains("already defined")) return "VARIABLE_ALREADY_DEFINED";

        // ── Classes & packages ─────────────────────────────────────────
        if (lower.contains("duplicate class")) return "DUPLICATE_CLASS";
        if (lower.contains("should be declared in a file named")) return "PUBLIC_CLASS_FILENAME";
        if (lower.contains("package") && lower.contains("does not exist")) return "PACKAGE_NOT_FOUND";

        // ── Control flow ───────────────────────────────────────────────
        if (lower.contains("unreachable statement")) return "UNREACHABLE_STATEMENT";
        if (lower.contains("break outside")) return "BREAK_OUTSIDE_LOOP";
        if (lower.contains("continue outside")) return "CONTINUE_OUTSIDE_LOOP";

        // ── Exceptions ─────────────────────────────────────────────────
        if (lower.contains("unreported exception")) return "UNREPORTED_EXCEPTION";

        // ── Types & operators ──────────────────────────────────────────
        if (lower.contains("incomparable types")) return "INCOMPARABLE_TYPES";
        if (lower.contains("bad operand types")) return "BAD_OPERAND_TYPES";
        if (lower.contains("operator") && lower.contains("cannot be applied")) return "OPERATOR_APPLICATION";
        if (lower.contains("illegal start of type")) return "ILLEGAL_START_TYPE";

        // ── Arrays ─────────────────────────────────────────────────────
        if (lower.contains("array dimension missing")) return "ARRAY_DIMENSION_MISSING";

        // ── Classic syntax / basic errors ──────────────────────────────
        if (lower.contains("';' expected")) return "MISSING_SEMICOLON";
        if (lower.contains("cannot find symbol")) return "CANNOT_FIND_SYMBOL";
        if (lower.contains("incompatible types")) return "INCOMPATIBLE_TYPES";
        if (lower.contains("reached end of file")) return "REACHED_END_OF_FILE";
        if (lower.contains("illegal start of expression")) return "ILLEGAL_START";
        if (lower.contains("class, interface, enum")) return "UNEXPECTED_TOKEN";
        if (lower.contains("variable might not have been initialized")) return "UNINITIALIZED_VARIABLE";
        if (lower.contains("array required")) return "ARRAY_REQUIRED";
        if (lower.contains("string cannot be converted")) return "TYPE_MISMATCH";
        if (lower.contains("unclosed")) return "UNCLOSED_BLOCK";
        if (lower.contains("illegal character")) return "ILLEGAL_CHARACTER";

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

    /** Finds the source line of the exception from the stack trace. */
    private long extractRuntimeLine(String output) {

        if (output == null) return 0;

        Matcher matcher = RUNTIME_LINE_PATTERN.matcher(output);
        if (matcher.find()) {
            try {
                return Long.parseLong(matcher.group(1));
            } catch (NumberFormatException ignored) {
            }
        }
        return 0;
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

    private static final class ProcessOutput {

        final String text;
        final int exitCode;
        final boolean timedOut;

        ProcessOutput(String text, int exitCode, boolean timedOut) {
            this.text = text;
            this.exitCode = exitCode;
            this.timedOut = timedOut;
        }
    }
}