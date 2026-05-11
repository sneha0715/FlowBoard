package com.flowboard.apigateway.filter;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Objects;

import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.flowboard.apigateway.util.JwtUtil;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * AuthenticationFilter — validates JWT at the gateway boundary.
 *
 * <p>Flow:
 * 1. Allow OPTIONS (CORS preflight) unconditionally.
 * 2. Strip any client-supplied spoofing headers.
 * 3. Extract and validate Bearer token.
 * 4. Inject downstream headers: X-User-Name, X-User-Roles, X-User-Id, X-Internal-Gateway-Secret.
 */
@Slf4j
@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    private static final String GATEWAY_SECRET = "FlowBoardGateway2024";
    private static final String INTERNAL_SECRET_HEADER = "X-Internal-Gateway-Secret";
    private static final String USER_NAME_HEADER = "X-User-Name";
    private static final String USER_ROLES_HEADER = "X-User-Roles";
    private static final String USER_ID_HEADER = "X-User-Id";

    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;

    public AuthenticationFilter(JwtUtil jwtUtil) {
        super(Config.class);
        this.jwtUtil = jwtUtil;
        this.objectMapper = new ObjectMapper();
    }

    public static class Config {
        // No config fields needed — filter is stateless
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();

            // 1. Allow CORS preflight immediately
            if (request.getMethod() == HttpMethod.OPTIONS) {
                return chain.filter(exchange);
            }

            // 2. Strip spoof headers coming from untrusted clients
            ServerHttpRequest mutatedRequest = request.mutate()
                    .headers(headers -> {
                        headers.remove(INTERNAL_SECRET_HEADER);
                        headers.remove(USER_NAME_HEADER);
                        headers.remove(USER_ROLES_HEADER);
                        headers.remove(USER_ID_HEADER);
                    })
                    .build();

            // 3. Extract Authorization header and always add Gateway Secret
            ServerHttpRequest nextRequest = mutatedRequest.mutate()
                    .header(INTERNAL_SECRET_HEADER, GATEWAY_SECRET)
                    .build();

            String authHeader = nextRequest.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.debug("No Authorization header for path: {}. Proceeding as Guest.", request.getPath());
                return chain.filter(exchange.mutate().request(nextRequest).build());
            }

            String token = authHeader.substring(7).trim();
            if (token.contains(",")) {
                token = token.split(",")[0].trim();
                if (token.startsWith("Bearer ")) {
                    token = token.substring(7).trim();
                }
            }

            // 4. Validate the token
            String validationError = jwtUtil.validateToken(token);
            if (validationError != null) {
                log.info("Invalid or expired JWT for path: {}. Error: {}", request.getPath(), validationError);
                return reject(exchange, HttpStatus.UNAUTHORIZED, "Token validation failed: " + validationError,
                        request.getPath().toString());
            }

            // 5. Extract claims and inject downstream headers
            String username = jwtUtil.extractSubject(token);
            String role = jwtUtil.extractRole(token);
            String userId = jwtUtil.extractUserId(token);

            ServerHttpRequest downstreamRequest = mutatedRequest.mutate()
                    .header(USER_NAME_HEADER, Objects.toString(username, ""))
                    .header(USER_ROLES_HEADER, Objects.toString(role, ""))
                    .header(USER_ID_HEADER, Objects.toString(userId, ""))
                    .header(INTERNAL_SECRET_HEADER, GATEWAY_SECRET)
                    .build();

            log.debug("Auth OK — user={}, role={}, userId={}", username, role, userId);
            return chain.filter(exchange.mutate().request(downstreamRequest).build());
        };
    }

    private Mono<Void> reject(ServerWebExchange exchange, HttpStatus status, String message, String path) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "status", status.value(),
                "message", message,
                "timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                "path", path
        );

        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(body);
        } catch (JsonProcessingException e) {
            bytes = ("{\"status\":401,\"message\":\"Unauthorized\"}").getBytes();
        }

        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }
}
