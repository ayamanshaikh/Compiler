package com.codevista.practice.dto;

import com.codevista.entity.Difficulty;
import com.codevista.practice.entity.QuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

public class PracticeQuestionCreateRequest {

    @NotBlank(message = "Topic slug is required")
    @Size(max = 150, message = "Topic slug must not exceed 150 characters")
    private String topicSlug;

    @NotNull(message = "Question type is required")
    private QuestionType questionType;

    @NotNull(message = "Difficulty is required")
    private Difficulty difficulty;

    @NotBlank(message = "Title is required")
    @Size(max = 250, message = "Title must not exceed 250 characters")
    private String title;

    @NotBlank(message = "Prompt is required")
    private String prompt;

    private String codeSnippet;

    private List<String> options = new ArrayList<>();

    @NotBlank(message = "Correct answer is required")
    private String correctAnswer;

    private String expectedOutput;

    private String starterCode;

    @NotBlank(message = "Explanation is required")
    private String explanation;

    private String hint;

    public PracticeQuestionCreateRequest() {
    }

    public PracticeQuestionCreateRequest(String topicSlug, QuestionType questionType, Difficulty difficulty,
                                         String title, String prompt, String correctAnswer, String explanation) {
        this.topicSlug = topicSlug;
        this.questionType = questionType;
        this.difficulty = difficulty;
        this.title = title;
        this.prompt = prompt;
        this.correctAnswer = correctAnswer;
        this.explanation = explanation;
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
        this.options = options != null ? options : new ArrayList<>();
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
}
