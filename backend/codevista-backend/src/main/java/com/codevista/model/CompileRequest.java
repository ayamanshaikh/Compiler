package com.codevista.model;

public class CompileRequest {

    private String code;
    private String language;

    public CompileRequest() {
    }

    public CompileRequest(String code) {
        this.code = code;
        this.language = "java";
    }

    public CompileRequest(String code, String language) {
        this.code = code;
        this.language = language;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }
}