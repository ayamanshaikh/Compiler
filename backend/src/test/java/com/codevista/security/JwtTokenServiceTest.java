package com.codevista.security;

import com.codevista.entity.User;
import com.codevista.entity.UserRole;
import com.codevista.exception.UnauthorizedException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtTokenServiceTest {

    private JwtTokenService tokenService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        tokenService = new JwtTokenService(
                "super-secure-secret-key-for-testing-purposes-only-384-bits-long",
                3600,
                objectMapper
        );
    }

    @Test
    @DisplayName("generateToken and validateAndParseToken should successfully round-trip claims")
    void generateAndValidateToken() {
        User user = new User("dev_alex", "alex@codevista.ai", "hash", UserRole.ROLE_STUDENT);
        user.setId(42L);

        String token = tokenService.generateToken(user);
        assertThat(token).isNotBlank();

        TokenClaims claims = tokenService.validateAndParseToken(token);
        assertThat(claims.userId()).isEqualTo(42L);
        assertThat(claims.username()).isEqualTo("dev_alex");
        assertThat(claims.email()).isEqualTo("alex@codevista.ai");
        assertThat(claims.role()).isEqualTo(UserRole.ROLE_STUDENT);
        assertThat(claims.isExpired()).isFalse();
    }

    @Test
    @DisplayName("validateAndParseToken should reject token with tampered payload")
    void rejectTamperedToken() {
        User user = new User("dev_alex", "alex@codevista.ai", "hash", UserRole.ROLE_STUDENT);
        user.setId(42L);

        String token = tokenService.generateToken(user);
        String[] parts = token.split("\\.");
        String tamperedToken = parts[0] + "." + parts[1] + "tampered" + "." + parts[2];

        assertThatThrownBy(() -> tokenService.validateAndParseToken(tamperedToken))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("validateAndParseToken should reject expired token")
    void rejectExpiredToken() {
        // Expiration of -10 seconds
        JwtTokenService expiredService = new JwtTokenService(
                "super-secure-secret-key-for-testing-purposes-only-384-bits-long",
                -10,
                objectMapper
        );
        User user = new User("dev_alex", "alex@codevista.ai", "hash", UserRole.ROLE_STUDENT);
        user.setId(42L);

        String token = expiredService.generateToken(user);

        assertThatThrownBy(() -> expiredService.validateAndParseToken(token))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("expired");
    }

    @Test
    @DisplayName("extractToken should properly extract token from Bearer header")
    void extractBearerToken() {
        assertThat(tokenService.extractToken("Bearer my.secret.token")).isEqualTo("my.secret.token");
        assertThat(tokenService.extractToken("Basic abc")).isNull();
        assertThat(tokenService.extractToken(null)).isNull();
        assertThat(tokenService.extractToken("Bearer ")).isNull();
    }
}
