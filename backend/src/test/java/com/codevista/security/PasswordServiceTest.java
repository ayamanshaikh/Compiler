package com.codevista.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PasswordServiceTest {

    private PasswordService passwordService;

    @BeforeEach
    void setUp() {
        passwordService = new PasswordService();
    }

    @Test
    @DisplayName("hashPassword should produce non-null salted hash with pbkdf2 prefix")
    void hashPasswordProducesSaltedHash() {
        String hash1 = passwordService.hashPassword("SuperSecret123!");
        String hash2 = passwordService.hashPassword("SuperSecret123!");

        assertThat(hash1).isNotNull().startsWith("pbkdf2:sha256:65536:");
        assertThat(hash2).isNotNull().startsWith("pbkdf2:sha256:65536:");
        // Salts should be unique
        assertThat(hash1).isNotEqualTo(hash2);
    }

    @Test
    @DisplayName("verifyPassword should verify matching password and reject incorrect password")
    void verifyPasswordWorksCorrectly() {
        String rawPassword = "JavaMaster2026";
        String hash = passwordService.hashPassword(rawPassword);

        assertThat(passwordService.verifyPassword(rawPassword, hash)).isTrue();
        assertThat(passwordService.verifyPassword("WrongPassword", hash)).isFalse();
        assertThat(passwordService.verifyPassword("", hash)).isFalse();
        assertThat(passwordService.verifyPassword(null, hash)).isFalse();
        assertThat(passwordService.verifyPassword(rawPassword, "invalid_hash_string")).isFalse();
    }

    @Test
    @DisplayName("hashPassword should reject null or empty password")
    void hashPasswordRejectsNullOrBlank() {
        assertThatThrownBy(() -> passwordService.hashPassword(null))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> passwordService.hashPassword("   "))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
