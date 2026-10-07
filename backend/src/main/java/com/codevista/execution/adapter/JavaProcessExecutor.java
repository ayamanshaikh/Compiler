package com.codevista.execution.adapter;

import com.codevista.compiler.adapter.JavaCompilerAdapter;
import com.codevista.compiler.intelligence.service.ErrorIntelligenceService;
import com.codevista.compiler.model.CompilationRequest;
import com.codevista.compiler.model.CompilationResult;
import com.codevista.compiler.model.CompilerDiagnostic;
import com.codevista.compiler.model.Language;
import com.codevista.execution.model.ExecutionRequest;
import com.codevista.execution.model.ExecutionResult;
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
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
public class JavaProcessExecutor implements LanguageExecutor {

    private static final Logger log = LoggerFactory.getLogger(JavaProcessExecutor.class);

    private static final long DEFAULT_TIMEOUT_MS = 4000;
    private static final int MAX_OUTPUT_CHARS = 100_000; // 100 KB standard output limit
    private static final String JVM_MAX_HEAP = "-Xmx64m";
    private static final String JVM_INIT_HEAP = "-Xms16m";
    private static final String JVM_STACK = "-Xss512k";
    private static final Semaphore PROCESS_CONCURRENCY_LIMITER = new Semaphore(8, true);

    private final JavaCompilerAdapter javaCompilerAdapter;
    private final ErrorIntelligenceService errorIntelligenceService;

    public JavaProcessExecutor(JavaCompilerAdapter javaCompilerAdapter, ErrorIntelligenceService errorIntelligenceService) {
        this.javaCompilerAdapter = javaCompilerAdapter;
        this.errorIntelligenceService = errorIntelligenceService;
    }

    @Override
    public Language getSupportedLanguage() {
        return Language.JAVA;
    }

    @Override
    public ExecutionResult execute(ExecutionRequest request) {
        Path sandboxDir = null;
        Process process = null;
        boolean permitAcquired = false;
        long startTime = System.currentTimeMillis();

        try {
            permitAcquired = PROCESS_CONCURRENCY_LIMITER.tryAcquire(5, TimeUnit.SECONDS);
            if (!permitAcquired) {
                return ExecutionResult.runtimeError("", "Server busy: concurrent execution limit reached. Please retry in a moment.", 0, -1);
            }

            sandboxDir = Files.createTempDirectory("codevista_exec_");

            // 1. Separate Compilation Step into sandbox directory
            CompilationRequest compRequest = new CompilationRequest(
                    Language.JAVA,
                    request.getSourceCode(),
                    request.getClassName()
            );

            CompilationResult compResult = javaCompilerAdapter.compileInto(sandboxDir, compRequest);
            if (!compResult.isSuccess()) {
                List<CompilerDiagnostic> enriched = errorIntelligenceService.enrichDiagnostics(compResult.getDiagnostics());
                return ExecutionResult.compilationError(enriched, compResult.getCompilationTimeMs());
            }

            // 2. Identify target class name
            String fqcn = javaCompilerAdapter.getFullyQualifiedClassName(compRequest);

            // 3. Construct isolated child JVM command
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

            // 4. Strict Environment Stripping (Secret & Credential Isolation)
            Map<String, String> env = pb.environment();
            String sysRoot = env.get("SystemRoot");
            String winDir = env.get("windir");
            String path = env.get("PATH");
            env.clear();
            if (sysRoot != null) env.put("SystemRoot", sysRoot);
            if (winDir != null) env.put("windir", winDir);
            if (path != null) env.put("PATH", path);

            // 5. Spawn child process
            process = pb.start();

            // 6. Handle standard input piping asynchronously
            pipeStandardInput(process, request.getInput());

            // 7. Stream stdout and stderr with output volume limits
            ExecutorService readerPool = Executors.newFixedThreadPool(2);
            AtomicBoolean outputExceeded = new AtomicBoolean(false);

            Future<String> stdoutFuture = readerPool.submit(new StreamConsumer(process.getInputStream(), outputExceeded, MAX_OUTPUT_CHARS));
            Future<String> stderrFuture = readerPool.submit(new StreamConsumer(process.getErrorStream(), outputExceeded, MAX_OUTPUT_CHARS));

            boolean finishedInTime = process.waitFor(DEFAULT_TIMEOUT_MS, TimeUnit.MILLISECONDS);
            long elapsed = Math.max(1, System.currentTimeMillis() - startTime);

            if (!finishedInTime) {
                destroyProcess(process);
                readerPool.shutdownNow();
                String partialStdout = getPartialOutput(stdoutFuture);
                return ExecutionResult.timeout(partialStdout, elapsed);
            }

            if (outputExceeded.get()) {
                destroyProcess(process);
                readerPool.shutdownNow();
                String partialStdout = getPartialOutput(stdoutFuture);
                return ExecutionResult.outputLimitExceeded(partialStdout, elapsed);
            }

            String stdout = stdoutFuture.get(1, TimeUnit.SECONDS);
            String stderr = stderrFuture.get(1, TimeUnit.SECONDS);
            readerPool.shutdown();

            int exitCode = process.exitValue();
            if (exitCode == 0) {
                return ExecutionResult.success(stdout, elapsed);
            } else {
                return ExecutionResult.runtimeError(stdout, stderr, elapsed, exitCode);
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            long elapsed = Math.max(1, System.currentTimeMillis() - startTime);
            return ExecutionResult.timeout("", elapsed);
        } catch (Exception e) {
            log.error("Execution error: {}", e.getMessage(), e);
            long elapsed = Math.max(1, System.currentTimeMillis() - startTime);
            return ExecutionResult.runtimeError("", "Internal execution error: " + e.getMessage(), elapsed, -1);
        } finally {
            if (permitAcquired) {
                PROCESS_CONCURRENCY_LIMITER.release();
            }
            if (process != null) {
                destroyProcess(process);
            }
            if (sandboxDir != null) {
                javaCompilerAdapter.deleteDirectoryRecursively(sandboxDir);
            }
        }
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
                // Process may have exited early or broken pipe - safe to ignore
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
            log.warn("Failed to forcibly terminate process: {}", e.getMessage());
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

    private String getPartialOutput(Future<String> future) {
        try {
            return future.get(500, TimeUnit.MILLISECONDS);
        } catch (Exception e) {
            return "";
        }
    }

    private static class StreamConsumer implements Callable<String> {
        private final InputStream inputStream;
        private final AtomicBoolean outputExceeded;
        private final int maxChars;

        public StreamConsumer(InputStream inputStream, AtomicBoolean outputExceeded, int maxChars) {
            this.inputStream = inputStream;
            this.outputExceeded = outputExceeded;
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
                        outputExceeded.set(true);
                        break;
                    }
                    sb.append(buffer, 0, read);
                }
            } catch (IOException e) {
                // Stream closed on process termination
            }
            return sb.toString();
        }
    }
}
