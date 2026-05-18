package com.dormscout.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;

@Service
public class AdminTokenService {

    private static final long TOKEN_TTL_MS = 8 * 60 * 60 * 1000L;

    @Value("${dormscout.admin.token-secret:change-this-admin-secret-in-production}")
    private String tokenSecret;

    public String createToken(Long adminUserId) {
        if (adminUserId == null) {
            throw new IllegalArgumentException("adminUserId required");
        }
        long expiresAt = System.currentTimeMillis() + TOKEN_TTL_MS;
        String payload = adminUserId + ":" + expiresAt;
        String signature = sign(payload);
        String raw = payload + ":" + signature;
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    public Optional<Long> validateToken(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        try {
            String decoded = new String(Base64.getUrlDecoder().decode(token), StandardCharsets.UTF_8);
            String[] parts = decoded.split(":");
            if (parts.length != 3) {
                return Optional.empty();
            }
            long userId = Long.parseLong(parts[0]);
            long expiresAt = Long.parseLong(parts[1]);
            String signature = parts[2];
            if (System.currentTimeMillis() > expiresAt) {
                return Optional.empty();
            }
            String expectedPayload = userId + ":" + expiresAt;
            if (!sign(expectedPayload).equals(signature)) {
                return Optional.empty();
            }
            return Optional.of(userId);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(tokenSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to sign admin token", e);
        }
    }
}
