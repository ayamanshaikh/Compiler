package com.codevista.security;

import com.codevista.entity.UserRole;

import java.time.Instant;

public record TokenClaims(
        Long userId,
        String username,
        String email,
        UserRole role,
        Instant issuedAt,
        Instant expiresAt
) {
    public boolean isExpired() {
        return expiresAt != null && Instant.now().isAfter(expiresAt);
    }
}
