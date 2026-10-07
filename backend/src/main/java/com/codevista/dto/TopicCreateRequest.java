package com.codevista.dto;

import com.codevista.entity.Difficulty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

public class TopicCreateRequest {

    @NotBlank(message = "Title must not be blank")
    @Size(max = 150, message = "Title must not exceed 150 characters")
    private String title;

    @NotBlank(message = "Slug must not be blank")
    @Size(max = 150, message = "Slug must not exceed 150 characters")
    private String slug;

    @NotBlank(message = "Description must not be blank")
    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    private String explanation;

    private String whyItMatters;

    private String syntax;

    @NotNull(message = "Difficulty must not be null")
    private Difficulty difficulty;

    private String internalUnit;

    private Integer sortOrder = 0;

    private List<String> keyPoints = new ArrayList<>();
    private List<String> commonMistakes = new ArrayList<>();
    private List<String> relatedTopicSlugs = new ArrayList<>();
    private List<CodeExampleDto> codeExamples = new ArrayList<>();

    public TopicCreateRequest() {
    }

    public TopicCreateRequest(String title, String slug, String description, Difficulty difficulty, String internalUnit, Integer sortOrder) {
        this.title = title;
        this.slug = slug;
        this.description = description;
        this.difficulty = difficulty;
        this.internalUnit = internalUnit;
        this.sortOrder = sortOrder != null ? sortOrder : 0;
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

    public Integer getSortOrder() {
        return sortOrder != null ? sortOrder : 0;
    }

    public void setSortOrder(Integer sortOrder) {
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
}
