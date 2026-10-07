package com.codevista.dto;

import com.codevista.entity.SavedSnippet;

import java.time.Instant;

public record SavedSnippetDto(
        Long id,
        String title,
        String code,
        String description,
        Instant createdAt,
        Instant updatedAt
) {
    public static SavedSnippetDto fromEntity(SavedSnippet snippet) {
        if (snippet == null) return null;
        return new SavedSnippetDto(
                snippet.getId(),
                snippet.getTitle(),
                snippet.getCode(),
                snippet.getDescription(),
                snippet.getCreatedAt(),
                snippet.getUpdatedAt()
        );
    }
}
