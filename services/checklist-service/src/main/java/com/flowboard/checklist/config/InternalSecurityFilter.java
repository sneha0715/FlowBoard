package com.flowboard.checklist.config;

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

        String path = request.getRequestURI();
        if (path.contains("/actuator") || path.contains("/v3/api-docs") || path.contains("/swagger-ui")) {
            filterChain.doFilter(request, response);
            return;
        }

        String incomingSecret = request.getHeader(GATEWAY_SECRET_HEADER);
        if (incomingSecret == null || !incomingSecret.equals(expectedSecret)) {
            log.warn("Rejected request to {} — invalid gateway secret", path);
            writeError(response, HttpStatus.UNAUTHORIZED,
                    "Access denied: request did not originate from the API Gateway", path);
            return;
        }

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
            if (userId != null && !userId.isBlank()) {
                try { request.setAttribute("userId", Long.parseLong(userId)); }
                catch (NumberFormatException ignored) {}
            }
            log.debug("Gateway-authenticated: user={}, role={}, userId={}", username, role, userId);
        } else {
            // Internal service-to-service call without user context
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken("internal-service", null, 
                            List.of(new SimpleGrantedAuthority("ROLE_INTERNAL")));
            SecurityContextHolder.getContext().setAuthentication(auth);
            log.debug("Internal service authentication set");
        }

        filterChain.doFilter(request, response);
    }

    private void writeError(HttpServletResponse response, HttpStatus status,
                            String message, String path) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), Map.of(
                "status", status.value(), "message", message,
                "timestamp", LocalDateTime.now().toString(), "path", path));
    }
}


