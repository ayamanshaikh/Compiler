package com.codevista.dto;

public class CodeExampleDto {

    private String title;
    private String code;
    private String explanation;

    public CodeExampleDto() {
    }

    public CodeExampleDto(String title, String code, String explanation) {
        this.title = title;
        this.code = code;
        this.explanation = explanation;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }
}

