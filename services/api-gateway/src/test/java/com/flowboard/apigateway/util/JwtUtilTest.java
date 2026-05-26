package com.flowboard.apigateway.util;

import static org.junit.jupiter.api.Assertions.*;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.util.Date;

class JwtUtilTest {

    private JwtUtil jwtUtil;
    private final String testSecret = "testSecrettestSecrettestSecrettestSecrettestSecret";

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "jwtSecret", testSecret);
    }

    private String createToken(String subject, Integer userId, String role, long expiryMs) {
        return Jwts.builder()
                .subject(subject)
                .claim("userId", userId)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiryMs))
                .signWith(Keys.hmacShaKeyFor(testSecret.getBytes(StandardCharsets.UTF_8)))
                .compact();
    }

    @Test
    void validateToken_ValidToken_ReturnsNull() {
        String token = createToken("user@example.com", 42, "MEMBER", 60000L);
        String result = jwtUtil.validateToken(token);
        assertNull(result, "Valid token should return null error message");
    }

    @Test
    void validateToken_ExpiredToken_ReturnsExpiredError() {
        String token = createToken("user@example.com", 42, "MEMBER", -60000L);
        String result = jwtUtil.validateToken(token);
        assertEquals("Token has expired", result);
    }

    @Test
    void validateToken_InvalidSignature_ReturnsSignatureError() {
        // Build a token with a different secret
        String invalidToken = Jwts.builder()
                .subject("user@example.com")
                .expiration(new Date(System.currentTimeMillis() + 60000L))
                .signWith(Keys.hmacShaKeyFor("differentSecretKeydifferentSecretKeydifferentSecretKey".getBytes(StandardCharsets.UTF_8)))
                .compact();

        String result = jwtUtil.validateToken(invalidToken);
        assertEquals("Invalid token signature or malformed token", result);
    }

    @Test
    void validateToken_MalformedToken_ReturnsSignatureError() {
        String result = jwtUtil.validateToken("not-a-valid-jwt-token");
        assertEquals("Invalid token signature or malformed token", result);
    }

    @Test
    void extractClaims_ExtractsCorrectly() {
        String token = createToken("user@example.com", 42, "MEMBER", 60000L);

        assertEquals("user@example.com", jwtUtil.extractSubject(token));
        assertEquals("MEMBER", jwtUtil.extractRole(token));
        assertEquals("42", jwtUtil.extractUserId(token));
    }
}
