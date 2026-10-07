package com.codevista.dto;

import com.codevista.compiler.model.CompilerDiagnostic;
import com.codevista.execution.model.ExecutionResult;
import com.codevista.execution.model.ExecutionStatus;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Collections;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ExecuteResponse {

    private boolean success;
    private ExecutionStatus status;
    private String output;
    private String runtimeError;
    private long executionTimeMs;
    private int exitCode;
    private List<CompilerDiagnostic> diagnostics;

    public ExecuteResponse() {
    }

    public ExecuteResponse(
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
        this.output = output;
        this.runtimeError = runtimeError;
        this.executionTimeMs = executionTimeMs;
        this.exitCode = exitCode;
        this.diagnostics = diagnostics != null ? diagnostics : Collections.emptyList();
    }

    public ExecuteResponse(ExecutionResult result) {
        this(
                result.isSuccess(),
                result.getStatus(),
                result.getOutput(),
                result.getRuntimeError(),
                result.getExecutionTimeMs(),
                result.getExitCode(),
                result.getDiagnostics()
        );
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public ExecutionStatus getStatus() {
        return status;
    }

    public void setStatus(ExecutionStatus status) {
        this.status = status;
    }

    public String getOutput() {
        return output;
    }

    public void setOutput(String output) {
        this.output = output;
    }

    public String getRuntimeError() {
        return runtimeError;
    }

    public void setRuntimeError(String runtimeError) {
        this.runtimeError = runtimeError;
    }

    public long getExecutionTimeMs() {
        return executionTimeMs;
    }

    public void setExecutionTimeMs(long executionTimeMs) {
        this.executionTimeMs = executionTimeMs;
    }

    public int getExitCode() {
        return exitCode;
    }

    public void setExitCode(int exitCode) {
        this.exitCode = exitCode;
    }

    public List<CompilerDiagnostic> getDiagnostics() {
        return diagnostics;
    }

    public void setDiagnostics(List<CompilerDiagnostic> diagnostics) {
        this.diagnostics = diagnostics;
    }
}
