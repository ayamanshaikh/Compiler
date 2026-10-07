package com.codevista.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SaveSnippetRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title cannot exceed 150 characters")
    private String title;

    @NotBlank(message = "Code is required")
    private String code;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    public SaveSnippetRequest() {
    }

    public SaveSnippetRequest(String title, String code, String description) {
        this.title = title;
        this.code = code;
        this.description = description;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
