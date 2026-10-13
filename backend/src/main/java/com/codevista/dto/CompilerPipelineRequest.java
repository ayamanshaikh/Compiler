package com.codevista.dto;

import jakarta.validation.constraints.NotBlank;

public class CompilerPipelineRequest {

    private String language = "JAVA";

    @NotBlank(message = "Source code must not be empty.")
    private String sourceCode;

    private String className;

    public CompilerPipelineRequest() {}

    public CompilerPipelineRequest(String language, String sourceCode, String className) {
        this.language = language != null ? language : "JAVA";
        this.sourceCode = sourceCode;
        this.className = className;
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

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }
}
