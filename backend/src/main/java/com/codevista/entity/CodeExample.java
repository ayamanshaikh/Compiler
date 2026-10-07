package com.codevista.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class CodeExample {

    @Column(length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String code;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    public CodeExample() {
    }

    public CodeExample(String title, String code, String explanation) {
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

