package com.codevista.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "user_progress", indexes = {
        @Index(name = "idx_user_progress_user_id", columnList = "user_id", unique = true)
})
public class UserProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_completed_topics", joinColumns = @JoinColumn(name = "progress_id"))
    @Column(name = "topic_slug", nullable = false)
    private Set<String> completedTopics = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_solved_questions", joinColumns = @JoinColumn(name = "progress_id"))
    @Column(name = "question_id", nullable = false)
    private Set<String> solvedQuestions = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_bookmarked_algorithms", joinColumns = @JoinColumn(name = "progress_id"))
    @Column(name = "algorithm_id", nullable = false)
    private Set<String> bookmarkedAlgorithms = new HashSet<>();

    @Column(name = "current_streak_days", nullable = false)
    private Integer currentStreakDays = 1;

    @Column(name = "last_active_at")
    private Instant lastActiveAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UserProgress() {
    }

    public UserProgress(User user) {
        this.user = user;
    }

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        Instant now = Instant.now();
        this.updatedAt = now;
        if (this.lastActiveAt == null) {
            this.lastActiveAt = now;
        }
        if (this.currentStreakDays == null || this.currentStreakDays < 1) {
            this.currentStreakDays = 1;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Set<String> getCompletedTopics() {
        return completedTopics;
    }

    public void setCompletedTopics(Set<String> completedTopics) {
        this.completedTopics = completedTopics != null ? completedTopics : new HashSet<>();
    }

    public Set<String> getSolvedQuestions() {
        return solvedQuestions;
    }

    public void setSolvedQuestions(Set<String> solvedQuestions) {
        this.solvedQuestions = solvedQuestions != null ? solvedQuestions : new HashSet<>();
    }

    public Set<String> getBookmarkedAlgorithms() {
        return bookmarkedAlgorithms;
    }

    public void setBookmarkedAlgorithms(Set<String> bookmarkedAlgorithms) {
        this.bookmarkedAlgorithms = bookmarkedAlgorithms != null ? bookmarkedAlgorithms : new HashSet<>();
    }

    public Integer getCurrentStreakDays() {
        return currentStreakDays;
    }

    public void setCurrentStreakDays(Integer currentStreakDays) {
        this.currentStreakDays = currentStreakDays;
    }

    public Instant getLastActiveAt() {
        return lastActiveAt;
    }

    public void setLastActiveAt(Instant lastActiveAt) {
        this.lastActiveAt = lastActiveAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
