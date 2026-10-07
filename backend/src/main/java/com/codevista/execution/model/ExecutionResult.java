package com.codevista.execution.model;

import com.codevista.compiler.model.CompilerDiagnostic;

import java.util.Collections;
import java.util.List;

public class ExecutionResult {

    private final boolean success;
    private final ExecutionStatus status;
    private final String output;
    private final String runtimeError;
    private final long executionTimeMs;
    private final int exitCode;
    private final List<CompilerDiagnostic> diagnostics;

    public ExecutionResult(
            boolean success,
            ExecutionStatus status,
            String output,
            String runtimeError,
            long executionTimeMs,
            int exitCode,
            List<CompilerDiagnostic> diagnostics
    ) {
        this.success = success;
        this.status = status;
        this.output = output != null ? output : "";
        this.runtimeError = runtimeError != null ? runtimeError : "";
        this.executionTimeMs = executionTimeMs;
        this.exitCode = exitCode;
        this.diagnostics = diagnostics != null ? diagnostics : Collections.emptyList();
    }

    public static ExecutionResult success(String output, long executionTimeMs) {
        return new ExecutionResult(true, ExecutionStatus.SUCCESS, output, "", executionTimeMs, 0, Collections.emptyList());
    }

    public static ExecutionResult runtimeError(String output, String runtimeError, long executionTimeMs, int exitCode) {
        return new ExecutionResult(false, ExecutionStatus.RUNTIME_ERROR, output, runtimeError, executionTimeMs, exitCode, Collections.emptyList());
    }

    public static ExecutionResult timeout(String output, long executionTimeMs) {
        return new ExecutionResult(false, ExecutionStatus.TIMEOUT, output, "Execution timed out. Program terminated.", executionTimeMs, -1, Collections.emptyList());
    }

    public static ExecutionResult outputLimitExceeded(String output, long executionTimeMs) {
        return new ExecutionResult(false, ExecutionStatus.OUTPUT_LIMIT_EXCEEDED, output, "Standard output limit exceeded. Output was truncated.", executionTimeMs, -1, Collections.emptyList());
    }

    public static ExecutionResult compilationError(List<CompilerDiagnostic> diagnostics, long compilationTimeMs) {
        return new ExecutionResult(false, ExecutionStatus.COMPILATION_ERROR, "", "Compilation failed before execution.", compilationTimeMs, 1, diagnostics);
    }

    public boolean isSuccess() {
        return success;
    }

    public ExecutionStatus getStatus() {
        return status;
    }

    public String getOutput() {
        return output;
    }

    public String getRuntimeError() {
        return runtimeError;
    }

    public long getExecutionTimeMs() {
        return executionTimeMs;
    }

    public int getExitCode() {
        return exitCode;
    }

    public List<CompilerDiagnostic> getDiagnostics() {
        return Collections.unmodifiableList(diagnostics);
    }
}
