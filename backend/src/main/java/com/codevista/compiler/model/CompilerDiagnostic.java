package com.codevista.compiler.model;

import com.codevista.compiler.intelligence.model.ErrorExplanation;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class CompilerDiagnostic {

    private final long line;
    private final long column;
    private final String message;
    private final String sourceContext;
    private final String diagnosticType;
    private final String code;
    private final ErrorExplanation explanation;

    public CompilerDiagnostic(long line, long column, String message, String sourceContext, String diagnosticType, String code) {
        this(line, column, message, sourceContext, diagnosticType, code, null);
    }

    public CompilerDiagnostic(long line, long column, String message, String sourceContext, String diagnosticType, String code, ErrorExplanation explanation) {
        this.line = line;
        this.column = column;
        this.message = message;
        this.sourceContext = sourceContext;
        this.diagnosticType = diagnosticType;
        this.code = code;
        this.explanation = explanation;
    }

    public long getLine() {
        return line;
    }

    public long getColumn() {
        return column;
    }

    public String getMessage() {
        return message;
    }

    public String getSourceContext() {
        return sourceContext;
    }

    public String getDiagnosticType() {
        return diagnosticType;
    }

    public String getCode() {
        return code;
    }

    public ErrorExplanation getExplanation() {
        return explanation;
    }

    public CompilerDiagnostic withExplanation(ErrorExplanation explanation) {
        return new CompilerDiagnostic(this.line, this.column, this.message, this.sourceContext, this.diagnosticType, this.code, explanation);
    }

    @Override
    public String toString() {
        return "CompilerDiagnostic{" +
                "line=" + line +
                ", column=" + column +
                ", message='" + message + '\'' +
                ", diagnosticType='" + diagnosticType + '\'' +
                ", hasExplanation=" + (explanation != null) +
                '}';
    }
}
