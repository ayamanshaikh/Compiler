package com.codevista.dto;

import com.codevista.entity.Difficulty;
import com.codevista.entity.Topic;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class TopicResponse {

    private Long id;
    private String title;
    private String slug;
    private String description;
    private String explanation;
    private String whyItMatters;
    private String syntax;
    private Difficulty difficulty;
    private String internalUnit;
    private int sortOrder;
    private List<String> keyPoints = new ArrayList<>();
    private List<String> commonMistakes = new ArrayList<>();
    private List<String> relatedTopicSlugs = new ArrayList<>();
    private List<CodeExampleDto> codeExamples = new ArrayList<>();
    private int practiceQuestionCount;
    private Instant createdAt;
    private Instant updatedAt;

    public TopicResponse() {
    }

    public TopicResponse(Topic topic) {
        this.id = topic.getId();
        this.title = topic.getTitle();
        this.slug = topic.getSlug();
        this.description = topic.getDescription();
        this.explanation = topic.getExplanation();
        this.whyItMatters = topic.getWhyItMatters();
        this.syntax = topic.getSyntax();
        this.difficulty = topic.getDifficulty();
        this.internalUnit = topic.getInternalUnit();
        this.sortOrder = topic.getSortOrder();
        this.keyPoints = topic.getKeyPoints() != null ? new ArrayList<>(topic.getKeyPoints()) : new ArrayList<>();
        this.commonMistakes = topic.getCommonMistakes() != null ? new ArrayList<>(topic.getCommonMistakes()) : new ArrayList<>();
        this.relatedTopicSlugs = topic.getRelatedTopicSlugs() != null ? new ArrayList<>(topic.getRelatedTopicSlugs()) : new ArrayList<>();
        this.codeExamples = topic.getCodeExamples() != null
                ? topic.getCodeExamples().stream()
                .map(ce -> new CodeExampleDto(ce.getTitle(), ce.getCode(), ce.getExplanation()))
                .collect(Collectors.toList())
                : new ArrayList<>();
        this.practiceQuestionCount = topic.getPracticeQuestionCount();
        this.createdAt = topic.getCreatedAt();
        this.updatedAt = topic.getUpdatedAt();
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
        this.keyPoints = keyPoints;
    }

    public List<String> getCommonMistakes() {
        return commonMistakes;
    }

    public void setCommonMistakes(List<String> commonMistakes) {
        this.commonMistakes = commonMistakes;
    }

    public List<String> getRelatedTopicSlugs() {
        return relatedTopicSlugs;
    }

    public void setRelatedTopicSlugs(List<String> relatedTopicSlugs) {
        this.relatedTopicSlugs = relatedTopicSlugs;
    }

    public List<CodeExampleDto> getCodeExamples() {
        return codeExamples;
    }

    public void setCodeExamples(List<CodeExampleDto> codeExamples) {
        this.codeExamples = codeExamples;
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

