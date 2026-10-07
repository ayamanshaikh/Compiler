package com.codevista.dto;

public record AuthResponse(
        String token,
        String tokenType,
        long expiresIn,
        UserSummaryDto user
) {
    public static AuthResponse of(String token, long expiresIn, UserSummaryDto user) {
        return new AuthResponse(token, "Bearer", expiresIn, user);
    }
}
