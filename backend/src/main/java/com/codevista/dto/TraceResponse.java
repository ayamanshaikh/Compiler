package com.codevista.dto;

import com.codevista.compiler.model.CompilerDiagnostic;
import com.codevista.execution.model.ExecutionStatus;
import com.codevista.trace.model.ExecutionTrace;
import com.codevista.trace.model.TraceStep;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class TraceResponse {

    private boolean success;
    private ExecutionStatus status;
    private int totalSteps;
    private List<TraceStep> steps;
    private String finalOutput;
    private long executionTimeMs;
    private String runtimeError;
    private List<CompilerDiagnostic> diagnostics;

    public TraceResponse() {
    }

    public TraceResponse(ExecutionTrace trace) {
        this.success = trace.isSuccess();
        this.status = trace.getStatus();
        this.totalSteps = trace.getTotalSteps();
        this.steps = trace.getSteps();
        this.finalOutput = trace.getFinalOutput();
        this.executionTimeMs = trace.getExecutionTimeMs();
        this.runtimeError = trace.getRuntimeError();
        this.diagnostics = trace.getDiagnostics();
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
