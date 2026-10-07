package com.codevista.trace.model;

import com.codevista.compiler.model.CompilerDiagnostic;
import com.codevista.execution.model.ExecutionStatus;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ExecutionTrace {

    private boolean success;
    private ExecutionStatus status;
    private int totalSteps;
    private List<TraceStep> steps = new ArrayList<>();
    private String finalOutput = "";
    private long executionTimeMs;
    private String runtimeError = "";
    private List<CompilerDiagnostic> diagnostics = new ArrayList<>();

    public ExecutionTrace() {
    }

    public ExecutionTrace(
            boolean success,
            ExecutionStatus status,
            List<TraceStep> steps,
            String finalOutput,
            long executionTimeMs,
            String runtimeError,
            List<CompilerDiagnostic> diagnostics
    ) {
        this.success = success;
        this.status = status;
        this.steps = steps != null ? steps : new ArrayList<>();
        this.totalSteps = this.steps.size();
        this.finalOutput = finalOutput != null ? finalOutput : "";
        this.executionTimeMs = executionTimeMs;
        this.runtimeError = runtimeError != null ? runtimeError : "";
        this.diagnostics = diagnostics != null ? diagnostics : new ArrayList<>();
    }

    public static ExecutionTrace compilationError(List<CompilerDiagnostic> diagnostics, long elapsed) {
        return new ExecutionTrace(false, ExecutionStatus.COMPILATION_ERROR, Collections.emptyList(), "", elapsed, "Compilation failed.", diagnostics);
    }

    public static ExecutionTrace runtimeError(List<TraceStep> steps, String finalOutput, String error, long elapsed) {
        return new ExecutionTrace(false, ExecutionStatus.RUNTIME_ERROR, steps, finalOutput, elapsed, error, Collections.emptyList());
    }

    public static ExecutionTrace timeout(List<TraceStep> steps, String partialOutput, long elapsed) {
        return new ExecutionTrace(false, ExecutionStatus.TIMEOUT, steps, partialOutput, elapsed, "Execution timed out.", Collections.emptyList());
    }

    public static ExecutionTrace success(List<TraceStep> steps, String finalOutput, long elapsed) {
        return new ExecutionTrace(true, ExecutionStatus.SUCCESS, steps, finalOutput, elapsed, "", Collections.emptyList());
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

    public int getTotalSteps() {
        return totalSteps;
    }

    public void setTotalSteps(int totalSteps) {
        this.totalSteps = totalSteps;
    }

    public List<TraceStep> getSteps() {
        return steps;
    }

    public void setSteps(List<TraceStep> steps) {
        this.steps = steps;
        this.totalSteps = steps != null ? steps.size() : 0;
    }

    public String getFinalOutput() {
        return finalOutput;
    }

    public void setFinalOutput(String finalOutput) {
        this.finalOutput = finalOutput;
    }

    public long getExecutionTimeMs() {
        return executionTimeMs;
    }

    public void setExecutionTimeMs(long executionTimeMs) {
        this.executionTimeMs = executionTimeMs;
    }

    public String getRuntimeError() {
        return runtimeError;
    }

    public void setRuntimeError(String runtimeError) {
        this.runtimeError = runtimeError;
    }

    public List<CompilerDiagnostic> getDiagnostics() {
        return diagnostics;
    }

    public void setDiagnostics(List<CompilerDiagnostic> diagnostics) {
        this.diagnostics = diagnostics;
    }
}
