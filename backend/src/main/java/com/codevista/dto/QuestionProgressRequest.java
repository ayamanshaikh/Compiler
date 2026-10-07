package com.codevista.dto;

import jakarta.validation.constraints.NotBlank;

public class QuestionProgressRequest {

    @NotBlank(message = "Question ID is required")
    private String questionId;

    private boolean solved = true;

    public QuestionProgressRequest() {
    }

    public QuestionProgressRequest(String questionId, boolean solved) {
        this.questionId = questionId;
        this.solved = solved;
    }

    public String getQuestionId() {
        return questionId;
    }

    public void setQuestionId(String questionId) {
        this.questionId = questionId;
    }

    public boolean isSolved() {
        return solved;
    }

    public void setSolved(boolean solved) {
        this.solved = solved;
    }
}
