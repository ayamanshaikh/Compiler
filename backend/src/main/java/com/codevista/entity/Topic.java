package com.codevista.entity;

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
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "topics", indexes = {
        @Index(name = "idx_topics_slug", columnList = "slug", unique = true),
        @Index(name = "idx_topics_difficulty", columnList = "difficulty"),
        @Index(name = "idx_topics_sort_order", columnList = "sort_order")
})
public class Topic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, unique = true, length = 150)
    private String slug;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "why_it_matters", columnDefinition = "TEXT")
    private String whyItMatters;

    @Column(columnDefinition = "TEXT")
    private String syntax;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Difficulty difficulty;

    /**
     * Internal organizational unit (e.g. Unit 1, Unit 2).
     * Internal reference only — not primary user-facing structure.
     */
    @Column(name = "internal_unit", length = 100)
    private String internalUnit;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "topic_key_points", joinColumns = @JoinColumn(name = "topic_id"))
    @Column(name = "point", length = 500)
    @OrderColumn(name = "point_order")
    private List<String> keyPoints = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "topic_common_mistakes", joinColumns = @JoinColumn(name = "topic_id"))
    @Column(name = "mistake", length = 500)
    @OrderColumn(name = "mistake_order")
    private List<String> commonMistakes = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "topic_related_slugs", joinColumns = @JoinColumn(name = "topic_id"))
    @Column(name = "related_slug", length = 150)
    private List<String> relatedTopicSlugs = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "topic_code_examples", joinColumns = @JoinColumn(name = "topic_id"))
    @OrderColumn(name = "example_order")
    private List<CodeExample> codeExamples = new ArrayList<>();

    @Column(name = "practice_question_count", nullable = false)
    private int practiceQuestionCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Topic() {
    }

    public Topic(String title, String slug, String description, Difficulty difficulty, String internalUnit, int sortOrder) {
        this.title = title;
        this.slug = slug;
        this.description = description;
        this.difficulty = difficulty;
        this.internalUnit = internalUnit;
        this.sortOrder = sortOrder;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public String getWhyItMatters() {
        return whyItMatters;
    }

    public void setWhyItMatters(String whyItMatters) {
        this.whyItMatters = whyItMatters;
    }

    public String getSyntax() {
        return syntax;
    }

    public void setSyntax(String syntax) {
        this.syntax = syntax;
    }

    public Difficulty getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(Difficulty difficulty) {
        this.difficulty = difficulty;
    }

    public String getInternalUnit() {
        return internalUnit;
    }

    public void setInternalUnit(String internalUnit) {
        this.internalUnit = internalUnit;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public List<String> getKeyPoints() {
        return keyPoints;
    }

    public void setKeyPoints(List<String> keyPoints) {
        this.keyPoints = keyPoints != null ? keyPoints : new ArrayList<>();
    }

    public List<String> getCommonMistakes() {
        return commonMistakes;
    }

    public void setCommonMistakes(List<String> commonMistakes) {
        this.commonMistakes = commonMistakes != null ? commonMistakes : new ArrayList<>();
    }

    public List<String> getRelatedTopicSlugs() {
        return relatedTopicSlugs;
    }

    public void setRelatedTopicSlugs(List<String> relatedTopicSlugs) {
        this.relatedTopicSlugs = relatedTopicSlugs != null ? relatedTopicSlugs : new ArrayList<>();
    }

    public List<CodeExample> getCodeExamples() {
        return codeExamples;
    }

    public void setCodeExamples(List<CodeExample> codeExamples) {
        this.codeExamples = codeExamples != null ? codeExamples : new ArrayList<>();
    }

    public int getPracticeQuestionCount() {
        return practiceQuestionCount;
    }

    public void setPracticeQuestionCount(int practiceQuestionCount) {
        this.practiceQuestionCount = practiceQuestionCount;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

