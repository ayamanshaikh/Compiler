package com.codevista.admin.dto;

import com.codevista.entity.User;
import com.codevista.entity.UserRole;

import java.time.Instant;

public class AdminUserSummaryDto {

    private Long id;
    private String username;
    private String email;
    private UserRole role;
    private Instant createdAt;
    private int solvedQuestionsCount;
    private int completedTopicsCount;
    private int bookmarkedAlgorithmsCount;
    private int savedSnippetsCount;

    public AdminUserSummaryDto() {
    }

    public AdminUserSummaryDto(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.role = user.getRole();
        this.createdAt = user.getCreatedAt();
        if (user.getProgress() != null) {
            this.solvedQuestionsCount = user.getProgress().getSolvedQuestions() != null ? user.getProgress().getSolvedQuestions().size() : 0;
            this.completedTopicsCount = user.getProgress().getCompletedTopics() != null ? user.getProgress().getCompletedTopics().size() : 0;
            this.bookmarkedAlgorithmsCount = user.getProgress().getBookmarkedAlgorithms() != null ? user.getProgress().getBookmarkedAlgorithms().size() : 0;
        } else {
            this.solvedQuestionsCount = 0;
            this.completedTopicsCount = 0;
            this.bookmarkedAlgorithmsCount = 0;
        }
        this.savedSnippetsCount = user.getSavedSnippets() != null ? user.getSavedSnippets().size() : 0;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public int getSolvedQuestionsCount() {
        return solvedQuestionsCount;
    }

    public void setSolvedQuestionsCount(int solvedQuestionsCount) {
        this.solvedQuestionsCount = solvedQuestionsCount;
    }

    public int getCompletedTopicsCount() {
        return completedTopicsCount;
    }

    public void setCompletedTopicsCount(int completedTopicsCount) {
        this.completedTopicsCount = completedTopicsCount;
    }

    public int getBookmarkedAlgorithmsCount() {
        return bookmarkedAlgorithmsCount;
    }

    public void setBookmarkedAlgorithmsCount(int bookmarkedAlgorithmsCount) {
        this.bookmarkedAlgorithmsCount = bookmarkedAlgorithmsCount;
    }

    public int getSavedSnippetsCount() {
        return savedSnippetsCount;
    }

    public void setSavedSnippetsCount(int savedSnippetsCount) {
        this.savedSnippetsCount = savedSnippetsCount;
    }
}
