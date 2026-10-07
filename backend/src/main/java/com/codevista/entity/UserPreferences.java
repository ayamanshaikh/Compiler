package com.codevista.entity;

import jakarta.persistence.Column;
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

@Entity
@Table(name = "user_preferences", indexes = {
        @Index(name = "idx_user_preferences_user_id", columnList = "user_id", unique = true)
})
public class UserPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, length = 20)
    private String theme = "dark";

    @Column(name = "font_size", nullable = false)
    private Integer fontSize = 14;

    @Column(name = "tab_size", nullable = false)
    private Integer tabSize = 4;

    @Column(name = "explanation_depth", nullable = false, length = 20)
    private String explanationDepth = "BEGINNER";

    @Column(name = "auto_run_enabled", nullable = false)
    private Boolean autoRunEnabled = false;

    @Column(name = "visualizer_speed", nullable = false)
    private Integer visualizerSpeed = 600;

    @Column(name = "accent", nullable = false, length = 20)
    private String accent = "emerald";

    @Column(name = "animation_mode", nullable = false, length = 20)
    private String animationMode = "balanced";

    @Column(name = "line_wrapping", nullable = false)
    private Boolean lineWrapping = true;

    @Column(name = "minimap", nullable = false)
    private Boolean minimap = false;

    @Column(name = "visualization_detail", nullable = false, length = 20)
    private String visualizationDetail = "standard";

    @Column(name = "visual_density", nullable = false, length = 20)
    private String visualDensity = "comfortable";

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UserPreferences() {
    }

    public UserPreferences(User user) {
        this.user = user;
    }

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
        if (this.theme == null) this.theme = "dark";
        if (this.fontSize == null || this.fontSize < 10 || this.fontSize > 32) this.fontSize = 14;
        if (this.tabSize == null || (this.tabSize != 2 && this.tabSize != 4)) this.tabSize = 4;
        if (this.explanationDepth == null) this.explanationDepth = "BEGINNER";
        if (this.autoRunEnabled == null) this.autoRunEnabled = false;
        if (this.visualizerSpeed == null || this.visualizerSpeed < 100 || this.visualizerSpeed > 3000) this.visualizerSpeed = 600;
        if (this.accent == null) this.accent = "emerald";
        if (this.animationMode == null) this.animationMode = "balanced";
        if (this.lineWrapping == null) this.lineWrapping = true;
        if (this.minimap == null) this.minimap = false;
        if (this.visualizationDetail == null) this.visualizationDetail = "standard";
        if (this.visualDensity == null) this.visualDensity = "comfortable";
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

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public Integer getFontSize() {
        return fontSize;
    }

    public void setFontSize(Integer fontSize) {
        this.fontSize = fontSize;
    }

    public Integer getTabSize() {
        return tabSize;
    }

    public void setTabSize(Integer tabSize) {
        this.tabSize = tabSize;
    }

    public String getExplanationDepth() {
        return explanationDepth;
    }

    public void setExplanationDepth(String explanationDepth) {
        this.explanationDepth = explanationDepth;
    }

    public Boolean getAutoRunEnabled() {
        return autoRunEnabled;
    }

    public void setAutoRunEnabled(Boolean autoRunEnabled) {
        this.autoRunEnabled = autoRunEnabled;
    }

    public Integer getVisualizerSpeed() {
        return visualizerSpeed;
    }

    public void setVisualizerSpeed(Integer visualizerSpeed) {
        this.visualizerSpeed = visualizerSpeed;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getAccent() {
        return accent;
    }

    public void setAccent(String accent) {
        this.accent = accent;
    }

    public String getAnimationMode() {
        return animationMode;
    }

    public void setAnimationMode(String animationMode) {
        this.animationMode = animationMode;
    }

    public Boolean getLineWrapping() {
        return lineWrapping;
    }

    public void setLineWrapping(Boolean lineWrapping) {
        this.lineWrapping = lineWrapping;
    }

    public Boolean getMinimap() {
        return minimap;
    }

    public void setMinimap(Boolean minimap) {
        this.minimap = minimap;
    }

    public String getVisualizationDetail() {
        return visualizationDetail;
    }

    public void setVisualizationDetail(String visualizationDetail) {
        this.visualizationDetail = visualizationDetail;
    }

    public String getVisualDensity() {
        return visualDensity;
    }

    public void setVisualDensity(String visualDensity) {
        this.visualDensity = visualDensity;
    }
}
