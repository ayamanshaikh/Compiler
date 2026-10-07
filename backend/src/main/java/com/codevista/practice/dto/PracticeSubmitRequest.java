package com.codevista.practice.dto;

import jakarta.validation.constraints.NotNull;

public class PracticeSubmitRequest {

    @NotNull(message = "questionId must not be null")
    private Long questionId;

    private String userAnswer;

    private String sourceCode;

    public PracticeSubmitRequest() {
    }

    public PracticeSubmitRequest(Long questionId, String userAnswer) {
        this.questionId = questionId;
        this.userAnswer = userAnswer;
    }

    public PracticeSubmitRequest(Long questionId, String userAnswer, String sourceCode) {
        this.questionId = questionId;
        this.userAnswer = userAnswer;
        this.sourceCode = sourceCode;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }

    public String getUserAnswer() {
        return userAnswer;
    }

    public void setUserAnswer(String userAnswer) {
        this.userAnswer = userAnswer;
    }

    public String getSourceCode() {
        return sourceCode;
    }

    public void setSourceCode(String sourceCode) {
        this.sourceCode = sourceCode;
    }
}
