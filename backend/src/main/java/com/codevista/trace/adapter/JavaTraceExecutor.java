package com.codevista.trace.adapter;

import com.codevista.compiler.adapter.JavaCompilerAdapter;
import com.codevista.compiler.intelligence.service.ErrorIntelligenceService;
import com.codevista.compiler.model.CompilationRequest;
import com.codevista.compiler.model.CompilationResult;
import com.codevista.compiler.model.CompilerDiagnostic;
import com.codevista.compiler.model.Language;
import com.codevista.execution.model.ExecutionRequest;
import com.codevista.trace.collector.TraceCollectorSource;
import com.codevista.trace.instrumenter.JavaSourceInstrumenter;
import com.codevista.trace.model.ExecutionTrace;
import com.codevista.trace.model.TraceStep;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

@Component
public class JavaTraceExecutor {

    private static final Logger log = LoggerFactory.getLogger(JavaTraceExecutor.class);

    private static final long DEFAULT_TIMEOUT_MS = 4000;
    private static final int MAX_OUTPUT_CHARS = 100_000;
    private static final String JVM_MAX_HEAP = "-Xmx64m";
    private static final String JVM_INIT_HEAP = "-Xms16m";
    private static final String JVM_STACK = "-Xss512k";
    private static final Semaphore TRACE_CONCURRENCY_LIMITER = new Semaphore(8, true);

    private final JavaCompilerAdapter javaCompilerAdapter;
    private final ErrorIntelligenceService errorIntelligenceService;
    private final JavaSourceInstrumenter javaSourceInstrumenter;
    private final ObjectMapper objectMapper;

    public JavaTraceExecutor(
            JavaCompilerAdapter javaCompilerAdapter,
            ErrorIntelligenceService errorIntelligenceService,
            JavaSourceInstrumenter javaSourceInstrumenter
    ) {
        this.javaCompilerAdapter = javaCompilerAdapter;
        this.errorIntelligenceService = errorIntelligenceService;
        this.javaSourceInstrumenter = javaSourceInstrumenter;
        this.objectMapper = new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    public ExecutionTrace trace(ExecutionRequest request) {
        Path sandboxDir = null;
        Process process = null;
        boolean permitAcquired = false;
        long startTime = System.currentTimeMillis();

        try {
            permitAcquired = TRACE_CONCURRENCY_LIMITER.tryAcquire(5, TimeUnit.SECONDS);
            if (!permitAcquired) {
                return ExecutionTrace.runtimeError(Collections.emptyList(), "", "Server busy: concurrent execution trace limit reached. Please retry in a moment.", 0);
            }

            sandboxDir = Files.createTempDirectory("codevista_trace_");

            // 1. Write the runtime tracer class to sandbox
            Path runtimeDir = sandboxDir.resolve("com").resolve("codevista").resolve("runtime");
            Files.createDirectories(runtimeDir);
            Path collectorFile = runtimeDir.resolve("CodeVistaTraceCollector.java");
            Files.writeString(collectorFile, TraceCollectorSource.SOURCE, StandardCharsets.UTF_8);

            // 2. Instrument user code
            String instrumentedSource = javaSourceInstrumenter.instrument(request.getSourceCode());

            // 3. Compile instrumented code into sandbox
            CompilationRequest compRequest = new CompilationRequest(
                    Language.JAVA,
                    instrumentedSource,
                    request.getClassName()
            );

            CompilationResult compResult = javaCompilerAdapter.compileInto(sandboxDir, compRequest);

            if (!compResult.isSuccess()) {
                // If instrumented compilation failed, compile original to see if user code has genuine syntax errors
                CompilationResult originalCompResult = javaCompilerAdapter.compile(
                        new CompilationRequest(Language.JAVA, request.getSourceCode(), request.getClassName())
                );
                List<CompilerDiagnostic> diagnostics = originalCompResult.isSuccess()
                        ? compResult.getDiagnostics()
                        : originalCompResult.getDiagnostics();

                List<CompilerDiagnostic> enriched = errorIntelligenceService.enrichDiagnostics(diagnostics);
                return ExecutionTrace.compilationError(enriched, compResult.getCompilationTimeMs());
            }

            // 4. Resolve main class name
            String fqcn = javaCompilerAdapter.getFullyQualifiedClassName(compRequest);

            // 5. Construct child JVM process
            List<String> command = new ArrayList<>();
            command.add(getJavaExecutablePath());
            command.add(JVM_MAX_HEAP);
            command.add(JVM_INIT_HEAP);
            command.add(JVM_STACK);
            command.add("-Dfile.encoding=UTF-8");
            command.add("-cp");
            command.add(sandboxDir.toAbsolutePath().toString());
            command.add(fqcn);

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.directory(sandboxDir.toFile());

            // 6. Strict Environment Variable Scrubbing
            Map<String, String> env = pb.environment();
            String sysRoot = env.get("SystemRoot");
            String winDir = env.get("windir");
            String path = env.get("PATH");
            env.clear();
            if (sysRoot != null) env.put("SystemRoot", sysRoot);
            if (winDir != null) env.put("windir", winDir);
            if (path != null) env.put("PATH", path);

            process = pb.start();

            // 7. Pipe standard input
            pipeStandardInput(process, request.getInput());

            // 8. Stream output
            ExecutorService readerPool = Executors.newFixedThreadPool(2);
            Future<String> stdoutFuture = readerPool.submit(new StreamConsumer(process.getInputStream(), MAX_OUTPUT_CHARS));
            Future<String> stderrFuture = readerPool.submit(new StreamConsumer(process.getErrorStream(), MAX_OUTPUT_CHARS));

            boolean finishedInTime = process.waitFor(DEFAULT_TIMEOUT_MS, TimeUnit.MILLISECONDS);
            long elapsed = Math.max(1, System.currentTimeMillis() - startTime);

            if (!finishedInTime) {
                destroyProcess(process);
                readerPool.shutdownNow();
                return ExecutionTrace.timeout(Collections.emptyList(), "", elapsed);
            }

            String rawStdout = stdoutFuture.get(1, TimeUnit.SECONDS);
            String stderr = stderrFuture.get(1, TimeUnit.SECONDS);
            readerPool.shutdown();

            int exitCode = process.exitValue();

            // 9. Extract trace data and clean up stdout
            TraceExtractionResult extracted = extractTrace(rawStdout);
            List<TraceStep> steps = extracted.steps;
            String cleanStdout = extracted.cleanOutput;

            if (exitCode == 0) {
                return ExecutionTrace.success(steps, cleanStdout, elapsed);
            } else {
                return ExecutionTrace.runtimeError(steps, cleanStdout, stderr, elapsed);
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            long elapsed = Math.max(1, System.currentTimeMillis() - startTime);
            return ExecutionTrace.timeout(Collections.emptyList(), "", elapsed);
        } catch (Exception e) {
            log.error("Trace execution failed: {}", e.getMessage(), e);
            long elapsed = Math.max(1, System.currentTimeMillis() - startTime);
            return ExecutionTrace.runtimeError(Collections.emptyList(), "", "Trace internal error: " + e.getMessage(), elapsed);
        } finally {
            if (permitAcquired) {
                TRACE_CONCURRENCY_LIMITER.release();
            }
            if (process != null) {
                destroyProcess(process);
            }
            if (sandboxDir != null) {
                javaCompilerAdapter.deleteDirectoryRecursively(sandboxDir);
            }
        }
    }

    private TraceExtractionResult extractTrace(String output) {
        String startMarker = "===CODEVISTA_TRACE_START===";
        String endMarker = "===CODEVISTA_TRACE_END===";

        int startIndex = output.indexOf(startMarker);
        int endIndex = output.indexOf(endMarker);

        if (startIndex != -1 && endIndex != -1 && endIndex > startIndex) {
            String jsonSnippet = output.substring(startIndex + startMarker.length(), endIndex).trim();
            String cleanOutput = output.substring(0, startIndex) + output.substring(endIndex + endMarker.length());

            try {
                List<TraceStep> steps = objectMapper.readValue(jsonSnippet, new TypeReference<List<TraceStep>>() {});
                return new TraceExtractionResult(steps, cleanOutput.trim());
            } catch (Exception e) {
                log.warn("Failed to parse trace JSON from process output: {}", e.getMessage());
                return new TraceExtractionResult(Collections.emptyList(), cleanOutput.trim());
            }
        }

        return new TraceExtractionResult(Collections.emptyList(), output.trim());
    }

    private void pipeStandardInput(Process process, String input) {
        Thread stdinThread = new Thread(() -> {
            try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(process.getOutputStream(), StandardCharsets.UTF_8))) {
                if (input != null && !input.isEmpty()) {
                    writer.write(input);
                    if (!input.endsWith("\n")) {
                        writer.newLine();
                    }
                    writer.flush();
                }
            } catch (IOException e) {
                // Ignore process early exit
            }
        });
        stdinThread.setDaemon(true);
        stdinThread.start();
    }

    private void destroyProcess(Process process) {
        if (process == null) return;
        try {
            process.descendants().forEach(ProcessHandle::destroyForcibly);
            process.destroyForcibly();
        } catch (Exception e) {
            log.warn("Failed to forcibly terminate trace process: {}", e.getMessage());
        }
    }

    private String getJavaExecutablePath() {
        String javaHome = System.getProperty("java.home");
        String javaExe = System.getProperty("os.name").toLowerCase().contains("win") ? "java.exe" : "java";
        File binJava = new File(javaHome + File.separator + "bin" + File.separator + javaExe);
        if (binJava.exists()) {
            return binJava.getAbsolutePath();
        }
        return "java";
    }

    private static class TraceExtractionResult {
        final List<TraceStep> steps;
        final String cleanOutput;

        TraceExtractionResult(List<TraceStep> steps, String cleanOutput) {
            this.steps = steps;
            this.cleanOutput = cleanOutput;
        }
    }

    private static class StreamConsumer implements Callable<String> {
        private final InputStream inputStream;
        private final int maxChars;

        public StreamConsumer(InputStream inputStream, int maxChars) {
            this.inputStream = inputStream;
            this.maxChars = maxChars;
        }

        @Override
        public String call() throws Exception {
            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
                char[] buffer = new char[1024];
                int read;
                while ((read = reader.read(buffer)) != -1) {
                    if (sb.length() + read > maxChars) {
                        int remaining = maxChars - sb.length();
                        if (remaining > 0) {
                            sb.append(buffer, 0, remaining);
                        }
                        break;
                    }
                    sb.append(buffer, 0, read);
                }
            } catch (IOException e) {
                // Stream closed
            }
            return sb.toString();
        }
    }
}
