package com.flowboard.apigateway.util;

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
 * JwtUtil — validates tokens at the Gateway boundary.
 * Downstream services never see raw JWTs; they receive injected headers instead.
 */
@Slf4j
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String jwtSecret;

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String validateToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            if (claims.getExpiration().before(new Date())) {
                return "Token has expired";
            }
            return null; // Valid
        } catch (io.jsonwebtoken.ExpiredJwtException ex) {
            log.debug("Gateway token validation failed (Expired): {}", ex.getMessage());
            return "Token has expired";
        } catch (JwtException ex) {
            log.error("Gateway token validation failed (JwtException): {}", ex.getMessage());
            return "Invalid token signature or malformed token";
        } catch (Exception ex) {
            log.error("Unexpected error validating token ({}): {}", ex.getClass().getName(), ex.getMessage());
            return "Unexpected token validation error";
        }
    }

    public String extractSubject(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    public String extractUserId(String token) {
        Object userId = extractAllClaims(token).get("userId");
        return userId != null ? userId.toString() : null;
    }
}
