package com.codevista.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CompileRequest {

    @NotBlank(message = "Language must not be blank")
    private String language;

    @NotBlank(message = "Source code must not be blank")
    @Size(max = 65536, message = "Source code must not exceed 64 KB (65,536 characters)")
    private String sourceCode;

    private String className;

    public CompileRequest() {
    }

    public CompileRequest(String language, String sourceCode) {
        this(language, sourceCode, null);
    }

    public CompileRequest(String language, String sourceCode, String className) {
        this.language = language;
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
