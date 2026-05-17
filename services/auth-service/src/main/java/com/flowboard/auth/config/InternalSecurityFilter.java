package com.flowboard.auth.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * InternalSecurityFilter — validates that requests arriving at auth-service
 * (for protected routes) originated from the API Gateway.
 *
 * <p>Public routes (/auth/login, /auth/register) bypass this filter via SecurityConfig.
 * All other routes require the X-Internal-Gateway-Secret header.
 */
@Slf4j
@Component
public class InternalSecurityFilter extends OncePerRequestFilter {

    private static final String GATEWAY_SECRET_HEADER = "X-Internal-Gateway-Secret";
    private static final String USER_NAME_HEADER      = "X-User-Name";
    private static final String USER_ROLES_HEADER     = "X-User-Roles";
    private static final String USER_ID_HEADER        = "X-User-Id";

    @Value("${gateway.secret:FlowBoardGateway2024}")
    private String expectedSecret;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // Skip actuator and public endpoints
        String path = request.getRequestURI();
        if (path.startsWith("/actuator") || path.equals("/auth/login") || path.equals("/auth/register")) {
            filterChain.doFilter(request, response);
            return;
        }

        String incomingSecret = request.getHeader(GATEWAY_SECRET_HEADER);

        if (incomingSecret == null || !incomingSecret.equals(expectedSecret)) {
            log.warn("Rejected request to {} — invalid or missing gateway secret", path);
            writeError(response, HttpStatus.UNAUTHORIZED,
                    "Access denied: request did not originate from the API Gateway", path);
            return;
        }

        // Secret is valid — reconstruct SecurityContext from injected headers
        String username = request.getHeader(USER_NAME_HEADER);
        String role     = request.getHeader(USER_ROLES_HEADER);
        String userId   = request.getHeader(USER_ID_HEADER);

        if (username != null && !username.isBlank()) {
            List<SimpleGrantedAuthority> authorities = (role != null && !role.isBlank())
                    ? List.of(new SimpleGrantedAuthority("ROLE_" + role))
                    : List.of();

            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(username, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(auth);
            log.debug("Gateway-authenticated user={}, role={}, userId={}", username, role, userId);
        }

        filterChain.doFilter(request, response);
    }

    private void writeError(HttpServletResponse response, HttpStatus status,
                            String message, String path) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        Map<String, Object> body = Map.of(
                "status", status.value(),
                "message", message,
                "timestamp", LocalDateTime.now().toString(),
                "path", path
        );
        objectMapper.writeValue(response.getWriter(), body);
    }
}


