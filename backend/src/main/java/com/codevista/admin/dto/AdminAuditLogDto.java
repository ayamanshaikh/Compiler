package com.codevista.admin.dto;

import com.codevista.entity.SystemAuditLog;

import java.time.Instant;

public class AdminAuditLogDto {

    private Long id;
    private String action;
    private String details;
    private Instant createdAt;

    public AdminAuditLogDto() {
    }

    public AdminAuditLogDto(SystemAuditLog log) {
        this.id = log.getId();
        this.action = log.getAction();
        this.details = log.getDetails();
        this.createdAt = log.getCreatedAt();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
