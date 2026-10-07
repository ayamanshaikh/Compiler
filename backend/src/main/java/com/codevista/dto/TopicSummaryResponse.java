package com.codevista.dto;

import com.codevista.entity.Difficulty;
import com.codevista.entity.Topic;

import java.util.ArrayList;
import java.util.List;

public class TopicSummaryResponse {

    private Long id;
    private String title;
    private String slug;
    private String description;
    private String whyItMatters;
    private Difficulty difficulty;
    private String internalUnit;
    private int sortOrder;
    private List<String> keyPoints = new ArrayList<>();
    private int practiceQuestionCount;

    public TopicSummaryResponse() {
    }

    public TopicSummaryResponse(Topic topic) {
        this.id = topic.getId();
        this.title = topic.getTitle();
        this.slug = topic.getSlug();
        this.description = topic.getDescription();
        this.whyItMatters = topic.getWhyItMatters();
        this.difficulty = topic.getDifficulty();
        this.internalUnit = topic.getInternalUnit();
        this.sortOrder = topic.getSortOrder();
        this.keyPoints = topic.getKeyPoints() != null ? new ArrayList<>(topic.getKeyPoints()) : new ArrayList<>();
        this.practiceQuestionCount = topic.getPracticeQuestionCount();
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

    public String getWhyItMatters() {
        return whyItMatters;
    }

    public void setWhyItMatters(String whyItMatters) {
        this.whyItMatters = whyItMatters;
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

    public int getPracticeQuestionCount() {
        return practiceQuestionCount;
    }

    public void setPracticeQuestionCount(int practiceQuestionCount) {
        this.practiceQuestionCount = practiceQuestionCount;
    }
}

