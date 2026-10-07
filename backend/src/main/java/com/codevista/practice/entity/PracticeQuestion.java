package com.codevista.practice.entity;

import com.codevista.entity.Difficulty;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "practice_questions", indexes = {
        @Index(name = "idx_practice_topic", columnList = "topic_slug"),
        @Index(name = "idx_practice_difficulty", columnList = "difficulty"),
        @Index(name = "idx_practice_type", columnList = "question_type")
})
public class PracticeQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "topic_slug", nullable = false, length = 150)
    private String topicSlug;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false, length = 30)
    private QuestionType questionType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Difficulty difficulty;

    @Column(nullable = false, length = 250)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String prompt;

    @Column(name = "code_snippet", columnDefinition = "TEXT")
    private String codeSnippet;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "practice_question_options", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "option_text", length = 500)
    @OrderColumn(name = "option_order")
    private List<String> options = new ArrayList<>();

    @Column(name = "correct_answer", nullable = false, columnDefinition = "TEXT")
    private String correctAnswer;

    @Column(name = "expected_output", columnDefinition = "TEXT")
    private String expectedOutput;

    @Column(name = "starter_code", columnDefinition = "TEXT")
    private String starterCode;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String explanation;

    @Column(columnDefinition = "TEXT")
    private String hint;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public PracticeQuestion() {
    }

    public PracticeQuestion(String topicSlug, QuestionType questionType, Difficulty difficulty,
                            String title, String prompt, String correctAnswer, String explanation) {
        this.topicSlug = topicSlug;
        this.questionType = questionType;
        this.difficulty = difficulty;
        this.title = title;
        this.prompt = prompt;
        this.correctAnswer = correctAnswer;
        this.explanation = explanation;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
