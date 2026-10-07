package com.codevista.cache;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Deterministic SHA-256 caching key generation for compilation and execution tracing.
 */
public class CompilationCache {

    private CompilationCache() {
        // Utility class
    }

    public static String computeCompileKey(String language, String className, String sourceCode) {
        String raw = (language != null ? language.trim().toLowerCase() : "java")
                + "::" + (className != null ? className.trim() : "")
                + "::" + (sourceCode != null ? sourceCode : "");
        return sha256Hex(raw);
    }

    public static String computeTraceKey(String language, String className, String sourceCode, String input) {
        String raw = (language != null ? language.trim().toLowerCase() : "java")
                + "::" + (className != null ? className.trim() : "")
                + "::" + (sourceCode != null ? sourceCode : "")
                + "::" + (input != null ? input : "");
        return sha256Hex(raw);
    }

    public static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * encodedhash.length);
            for (byte b : encodedhash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            // Fallback to string hash code if SHA-256 is somehow unavailable
            return Integer.toHexString(input.hashCode());
        }
    }
}
