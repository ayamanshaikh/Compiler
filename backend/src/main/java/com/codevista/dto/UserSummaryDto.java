package com.codevista.dto;

import com.codevista.entity.UserRole;

import java.time.Instant;

public record UserSummaryDto(
        Long id,
        String username,
        String email,
        UserRole role,
        Instant createdAt
) {
}
