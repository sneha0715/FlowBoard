package com.flowboard.auth.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JwtUtil — generates and validates JWTs for the auth-service.
 * Uses jjwt 0.12.3 API.
 * JWT claims: sub (email), userId (Integer), role (String), department (String).
 */
@Slf4j
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long tokenExpiry;

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    // ── Token Generation ───────────────────────────────────────────────────────

    public String generateToken(String email, int userId, String role, String department) {
        log.debug("Generating JWT for email={}, role={}", email, role);
        return Jwts.builder()
                .subject(email)
                .claim("userId", userId)
                .claim("role", role)
                .claim("department", department)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + tokenExpiry))
                .signWith(signingKey())
                .compact();
    }

    // ── Claim Extraction ───────────────────────────────────────────────────────

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    public int extractUserId(String token) {
        return extractAllClaims(token).get("userId", Integer.class);
    }

    // ── Validation ─────────────────────────────────────────────────────────────

    public boolean isTokenStructurallyValid(String token) {
        try {
            Claims claims = extractAllClaims(token);
            boolean notExpired = claims.getExpiration().after(new Date());
            if (!notExpired) log.debug("Token expired");
            return notExpired;
        } catch (JwtException ex) {
            log.debug("Token invalid: {}", ex.getMessage());
            return false;
        } catch (Exception ex) {
            log.warn("Unexpected token validation error: {}", ex.getMessage());
            return false;
        }
    }
}