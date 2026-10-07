package com.codevista.practice.dto;

import java.util.List;

public class PracticeSubmitResponse {

    private Long questionId;
    private boolean correct;
    private String userAnswer;
    private String correctAnswer;
    private String explanation;
    private String compilerOutput;
    private String compilerStatus;
    private String feedback;
    private List<String> compilerDiagnostics;

    public PracticeSubmitResponse() {
    }

    public PracticeSubmitResponse(Long questionId, boolean correct, String userAnswer,
                                  String correctAnswer, String explanation, String feedback) {
        this.questionId = questionId;
        this.correct = correct;
        this.userAnswer = userAnswer;
        this.correctAnswer = correctAnswer;
        this.explanation = explanation;
        this.feedback = feedback;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }

    public boolean isCorrect() {
        return correct;
    }

    public void setCorrect(boolean correct) {
        this.correct = correct;
    }

    public String getUserAnswer() {
        return userAnswer;
    }

    public void setUserAnswer(String userAnswer) {
        this.userAnswer = userAnswer;
    }

    public String getCorrectAnswer() {
        return correctAnswer;
    }

    public void setCorrectAnswer(String correctAnswer) {
        this.correctAnswer = correctAnswer;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public String getCompilerOutput() {
        return compilerOutput;
    }

    public void setCompilerOutput(String compilerOutput) {
        this.compilerOutput = compilerOutput;
    }

    public String getCompilerStatus() {
        return compilerStatus;
    }

    public void setCompilerStatus(String compilerStatus) {
        this.compilerStatus = compilerStatus;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public List<String> getCompilerDiagnostics() {
        return compilerDiagnostics;
    }

    public void setCompilerDiagnostics(List<String> compilerDiagnostics) {
        this.compilerDiagnostics = compilerDiagnostics;
    }
}
