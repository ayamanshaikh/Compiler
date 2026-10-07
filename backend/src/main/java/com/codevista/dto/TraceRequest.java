package com.codevista.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class TraceRequest {

    @NotBlank(message = "Language must not be blank")
    private String language;

    @NotBlank(message = "Source code must not be blank")
    @Size(max = 65536, message = "Source code must not exceed 64 KB")
    private String sourceCode;

    @Size(max = 16384, message = "Standard input must not exceed 16 KB")
    private String input;

    private String className;

    public TraceRequest() {
    }

    public TraceRequest(String language, String sourceCode, String input, String className) {
        this.language = language;
        this.sourceCode = sourceCode;
        this.input = input;
        this.className = className;
    }

    public TraceRequest(String language, String sourceCode, String input) {
        this(language, sourceCode, input, null);
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getSourceCode() {
        return sourceCode;
    }

    public void setSourceCode(String sourceCode) {
        this.sourceCode = sourceCode;
    }

    public String getInput() {
        return input;
    }

    public void setInput(String input) {
        this.input = input;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }
}
