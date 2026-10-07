package com.codevista.security;

import org.springframework.stereotype.Service;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.util.HexFormat;

@Service
public class PasswordService {

    private static final String ALGORITHM = "PBKDF2WithHmacSHA256";
    private static final int ITERATIONS = 65536;
    private static final int KEY_LENGTH = 256;
    private static final int SALT_BYTES = 16;
    private static final String PREFIX = "pbkdf2:sha256:" + ITERATIONS + ":";

    private final SecureRandom secureRandom = new SecureRandom();

    public String hashPassword(String rawPassword) {
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalArgumentException("Password cannot be null or empty");
        }

        byte[] salt = new byte[SALT_BYTES];
        secureRandom.nextBytes(salt);

        byte[] hash = pbkdf2(rawPassword.toCharArray(), salt, ITERATIONS, KEY_LENGTH);

        HexFormat hex = HexFormat.of();
        return PREFIX + hex.formatHex(salt) + ":" + hex.formatHex(hash);
    }

    public boolean verifyPassword(String rawPassword, String storedHash) {
        if (rawPassword == null || storedHash == null || !storedHash.startsWith("pbkdf2:sha256:")) {
            return false;
        }

        String[] parts = storedHash.split(":");
        if (parts.length != 5) {
            return false;
        }

        try {
            int iterations = Integer.parseInt(parts[2]);
            HexFormat hex = HexFormat.of();
            byte[] salt = hex.parseHex(parts[3]);
            byte[] expectedHash = hex.parseHex(parts[4]);

            byte[] actualHash = pbkdf2(rawPassword.toCharArray(), salt, iterations, expectedHash.length * 8);

            return MessageDigest.isEqual(expectedHash, actualHash);
        } catch (Exception ex) {
            return false;
        }
    }

    private byte[] pbkdf2(char[] password, byte[] salt, int iterations, int keyLength) {
        try {
            PBEKeySpec spec = new PBEKeySpec(password, salt, iterations, keyLength);
            SecretKeyFactory factory = SecretKeyFactory.getInstance(ALGORITHM);
            return factory.generateSecret(spec).getEncoded();
        } catch (NoSuchAlgorithmException | InvalidKeySpecException e) {
            throw new IllegalStateException("Failed to hash password using " + ALGORITHM, e);
        }
    }
}
