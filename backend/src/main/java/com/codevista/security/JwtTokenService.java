package com.codevista.security;

import com.codevista.entity.User;
import com.codevista.entity.UserRole;
import com.codevista.exception.UnauthorizedException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;

@Service
public class JwtTokenService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final String JWT_HEADER_JSON = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";

    private final String jwtSecret;
    private final long expirationSeconds;
    private final ObjectMapper objectMapper;
    private final String encodedHeader;

    public JwtTokenService(
            @Value("${codevista.auth.jwt-secret:codevista-ai-default-secure-jwt-signing-key-educational-384-bits}") String jwtSecret,
            @Value("${codevista.auth.jwt-expiration-seconds:604800}") long expirationSeconds,
            @Autowired(required = false) ObjectMapper objectMapper
    ) {
        this.jwtSecret = jwtSecret;
        this.expirationSeconds = expirationSeconds;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
        this.encodedHeader = base64UrlEncode(JWT_HEADER_JSON.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(User user) {
        long nowSeconds = Instant.now().getEpochSecond();
        long expSeconds = nowSeconds + expirationSeconds;

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("sub", user.getId().toString());
        payload.put("username", user.getUsername());
        payload.put("email", user.getEmail());
        payload.put("role", user.getRole().name());
        payload.put("iat", nowSeconds);
        payload.put("exp", expSeconds);

        byte[] payloadBytes;
        try {
            payloadBytes = objectMapper.writeValueAsBytes(payload);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize JWT claims payload", e);
        }

        String encodedPayload = base64UrlEncode(payloadBytes);
        String dataToSign = encodedHeader + "." + encodedPayload;
        String signature = sign(dataToSign);

        return dataToSign + "." + signature;
    }

    public TokenClaims validateAndParseToken(String token) {
        if (token == null || token.isBlank()) {
            throw new UnauthorizedException("Missing authentication token");
        }

        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new UnauthorizedException("Malformed authentication token format");
        }

        String headerPart = parts[0];
        String payloadPart = parts[1];
        String signaturePart = parts[2];

        String dataToSign = headerPart + "." + payloadPart;
        String expectedSignature = sign(dataToSign);

        if (!MessageDigest.isEqual(
                signaturePart.getBytes(StandardCharsets.UTF_8),
                expectedSignature.getBytes(StandardCharsets.UTF_8)
        )) {
            throw new UnauthorizedException("Invalid authentication signature");
        }

        try {
            byte[] payloadBytes = base64UrlDecode(payloadPart);
            JsonNode jsonNode = objectMapper.readTree(payloadBytes);

            long exp = jsonNode.path("exp").asLong(0);
            long now = Instant.now().getEpochSecond();
            if (exp > 0 && now >= exp) {
                throw new UnauthorizedException("Authentication token has expired");
            }

            Long userId = Long.parseLong(jsonNode.path("sub").asText());
            String username = jsonNode.path("username").asText();
            String email = jsonNode.path("email").asText();
            String roleStr = jsonNode.path("role").asText(UserRole.ROLE_STUDENT.name());
            UserRole role = UserRole.valueOf(roleStr);
            long iat = jsonNode.path("iat").asLong(now);

            return new TokenClaims(
                    userId,
                    username,
                    email,
                    role,
                    Instant.ofEpochSecond(iat),
                    Instant.ofEpochSecond(exp)
            );
        } catch (UnauthorizedException ue) {
            throw ue;
        } catch (Exception e) {
            throw new UnauthorizedException("Unable to parse authentication token claims");
        }
    }

    public String extractToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authorizationHeader.substring(7).trim();
        return token.isEmpty() ? null : token;
    }

    public long getExpirationSeconds() {
        return expirationSeconds;
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec secretKeySpec = new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM);
            mac.init(secretKeySpec);
            byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return base64UrlEncode(hmacBytes);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("Failed to compute HMAC signature for JWT", e);
        }
    }

    private String base64UrlEncode(byte[] data) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(data);
    }

    private byte[] base64UrlDecode(String base64Url) {
        return Base64.getUrlDecoder().decode(base64Url);
    }
}
