package com.codevista.model;

import java.util.List;

public class CompileResponse {

    private boolean success;
    private String message;
    private String error;
    private String explanation;
    private long lineNumber;
    private String suggestion;
    private String output;
    private List<ExecutionStep> executionSteps = List.of();
    private boolean executionTraceTruncated;

    public CompileResponse() {
    }

    public CompileResponse(
            boolean success,
            String message,
            String error,
            String explanation,
            long lineNumber,
            String suggestion,
            String output
    ) {
        this.success = success;
        this.message = message;
        this.error = error;
        this.explanation = explanation;
        this.lineNumber = lineNumber;
        this.suggestion = suggestion;
        this.output = output;
    }

    public CompileResponse(
            boolean success,
            String message,
            String error,
            String explanation,
            long lineNumber,
            String suggestion,
            String output,
            List<ExecutionStep> executionSteps,
            boolean executionTraceTruncated
    ) {
        this(success, message, error, explanation, lineNumber, suggestion, output);
        this.executionSteps = executionSteps != null ? executionSteps : List.of();
        this.executionTraceTruncated = executionTraceTruncated;
    }

    public List<ExecutionStep> getExecutionSteps() {
        return executionSteps;
    }

    public void setExecutionSteps(List<ExecutionStep> executionSteps) {
        this.executionSteps = executionSteps;
    }

    public boolean isExecutionTraceTruncated() {
        return executionTraceTruncated;
    }

    public void setExecutionTraceTruncated(boolean executionTraceTruncated) {
        this.executionTraceTruncated = executionTraceTruncated;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public long getLineNumber() {
        return lineNumber;
    }

    public void setLineNumber(long lineNumber) {
        this.lineNumber = lineNumber;
    }

    public String getSuggestion() {
        return suggestion;
    }

    public void setSuggestion(String suggestion) {
        this.suggestion = suggestion;
    }

    public String getOutput() {
        return output;
    }

    public void setOutput(String output) {
        this.output = output;
    }
}
