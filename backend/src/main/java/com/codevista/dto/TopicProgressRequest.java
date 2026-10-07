package com.codevista.dto;

import jakarta.validation.constraints.NotBlank;

public class TopicProgressRequest {

    @NotBlank(message = "Topic slug is required")
    private String topicSlug;

    private boolean completed = true;

    public TopicProgressRequest() {
    }

    public TopicProgressRequest(String topicSlug, boolean completed) {
        this.topicSlug = topicSlug;
        this.completed = completed;
    }

    public String getTopicSlug() {
        return topicSlug;
    }

    public void setTopicSlug(String topicSlug) {
        this.topicSlug = topicSlug;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }
}
