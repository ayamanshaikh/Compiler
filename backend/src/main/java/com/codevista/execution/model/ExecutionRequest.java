package com.codevista.execution.model;

import com.codevista.compiler.model.Language;

public class ExecutionRequest {

    private final Language language;
    private final String sourceCode;
    private final String input;
    private final String className;

    public ExecutionRequest(Language language, String sourceCode, String input, String className) {
        this.language = language;
        this.sourceCode = sourceCode;
        this.input = input != null ? input : "";
        this.className = className;
    }

    public ExecutionRequest(Language language, String sourceCode, String input) {
        this(language, sourceCode, input, null);
    }

    public Language getLanguage() {
        return language;
    }

    public String getSourceCode() {
        return sourceCode;
    }

    public String getInput() {
        return input;
    }

    public String getClassName() {
        return className;
    }
}
