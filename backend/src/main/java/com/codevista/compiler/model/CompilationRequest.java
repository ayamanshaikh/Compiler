package com.codevista.compiler.model;

public class CompilationRequest {

    private final Language language;
    private final String sourceCode;
    private final String className;

    public CompilationRequest(Language language, String sourceCode) {
        this(language, sourceCode, null);
    }

    public CompilationRequest(Language language, String sourceCode, String className) {
        this.language = language;
        this.sourceCode = sourceCode;
        this.className = className;
    }

    public Language getLanguage() {
        return language;
    }

    public String getSourceCode() {
        return sourceCode;
    }

    public String getClassName() {
        return className;
    }
}
