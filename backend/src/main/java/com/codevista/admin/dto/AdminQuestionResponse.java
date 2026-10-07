package com.codevista.admin.dto;

import com.codevista.entity.Difficulty;
import com.codevista.practice.entity.PracticeQuestion;
import com.codevista.practice.entity.QuestionType;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class AdminQuestionResponse {

    private Long id;
    private String topicSlug;
    private QuestionType questionType;
    private Difficulty difficulty;
    private String title;
    private String prompt;
    private String codeSnippet;
    private List<String> options = new ArrayList<>();
    private String correctAnswer;
    private String expectedOutput;
    private String starterCode;
    private String explanation;
    private String hint;
    private Instant createdAt;

    public AdminQuestionResponse() {
    }

    public AdminQuestionResponse(PracticeQuestion q) {
        this.id = q.getId();
        this.topicSlug = q.getTopicSlug();
        this.questionType = q.getQuestionType();
        this.difficulty = q.getDifficulty();
        this.title = q.getTitle();
        this.prompt = q.getPrompt();
        this.codeSnippet = q.getCodeSnippet();
        this.options = q.getOptions() != null ? new ArrayList<>(q.getOptions()) : new ArrayList<>();
        this.correctAnswer = q.getCorrectAnswer();
        this.expectedOutput = q.getExpectedOutput();
        this.starterCode = q.getStarterCode();
        this.explanation = q.getExplanation();
        this.hint = q.getHint();
        this.createdAt = q.getCreatedAt();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTopicSlug() {
        return topicSlug;
    }

    public void setTopicSlug(String topicSlug) {
        this.topicSlug = topicSlug;
    }

    public QuestionType getQuestionType() {
        return questionType;
    }

    public void setQuestionType(QuestionType questionType) {
        this.questionType = questionType;
    }

    public Difficulty getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(Difficulty difficulty) {
        this.difficulty = difficulty;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }

    public String getCodeSnippet() {
        return codeSnippet;
    }

    public void setCodeSnippet(String codeSnippet) {
        this.codeSnippet = codeSnippet;
    }

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(List<String> options) {
        this.options = options;
    }

    public String getCorrectAnswer() {
        return correctAnswer;
    }

    public void setCorrectAnswer(String correctAnswer) {
        this.correctAnswer = correctAnswer;
    }

    public String getExpectedOutput() {
        return expectedOutput;
    }

    public void setExpectedOutput(String expectedOutput) {
        this.expectedOutput = expectedOutput;
    }

    public String getStarterCode() {
        return starterCode;
    }

    public void setStarterCode(String starterCode) {
        this.starterCode = starterCode;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public String getHint() {
        return hint;
    }

    public void setHint(String hint) {
        this.hint = hint;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
