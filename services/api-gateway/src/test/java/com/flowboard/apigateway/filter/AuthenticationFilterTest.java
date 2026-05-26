package com.flowboard.apigateway.filter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;

import com.flowboard.apigateway.util.JwtUtil;

import reactor.core.publisher.Mono;

@ExtendWith(MockitoExtension.class)
class AuthenticationFilterTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private GatewayFilterChain filterChain;

    private AuthenticationFilter authenticationFilter;

    private static final String GATEWAY_SECRET = "FlowBoardGateway2024";
    private static final String INTERNAL_SECRET_HEADER = "X-Internal-Gateway-Secret";
    private static final String USER_NAME_HEADER = "X-User-Name";
    private static final String USER_ROLES_HEADER = "X-User-Roles";
    private static final String USER_ID_HEADER = "X-User-Id";

    @BeforeEach
    void setUp() {
        authenticationFilter = new AuthenticationFilter(jwtUtil);
        when(filterChain.filter(any(ServerWebExchange.class))).thenReturn(Mono.empty());
    }

    @Test
    void optionsRequest_BypassesFilterUnconditionally() {
        MockServerHttpRequest request = MockServerHttpRequest.method(HttpMethod.OPTIONS, "/api/boards")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilter filter = authenticationFilter.apply(new AuthenticationFilter.Config());
        filter.filter(exchange, filterChain).block();

        verify(filterChain).filter(exchange);
        verifyNoInteractions(jwtUtil);
    }

    @Test
    void noAuthHeader_ProceedsAsGuestWithSecretAndStrippedHeaders() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/boards")
                .header(USER_NAME_HEADER, "SpoofedUser")
                .header(INTERNAL_SECRET_HEADER, "SpoofedSecret")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilter filter = authenticationFilter.apply(new AuthenticationFilter.Config());
        filter.filter(exchange, filterChain).block();

        ArgumentCaptor<ServerWebExchange> exchangeCaptor = ArgumentCaptor.forClass(ServerWebExchange.class);
        verify(filterChain).filter(exchangeCaptor.capture());

        ServerHttpRequest downstreamRequest = exchangeCaptor.getValue().getRequest();
        assertEquals(GATEWAY_SECRET, downstreamRequest.getHeaders().getFirst(INTERNAL_SECRET_HEADER));
        assertNull(downstreamRequest.getHeaders().getFirst(USER_NAME_HEADER), "Spoofed username should be stripped");
    }

    @Test
    void invalidToken_ProceedsAsGuestWithSecretAndStrippedHeaders() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/boards")
                .header(HttpHeaders.AUTHORIZATION, "Bearer invalid-token")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        when(jwtUtil.validateToken("invalid-token")).thenReturn("Invalid token signature or malformed token");

        GatewayFilter filter = authenticationFilter.apply(new AuthenticationFilter.Config());
        filter.filter(exchange, filterChain).block();

        ArgumentCaptor<ServerWebExchange> exchangeCaptor = ArgumentCaptor.forClass(ServerWebExchange.class);
        verify(filterChain).filter(exchangeCaptor.capture());

        ServerHttpRequest downstreamRequest = exchangeCaptor.getValue().getRequest();
        assertEquals(GATEWAY_SECRET, downstreamRequest.getHeaders().getFirst(INTERNAL_SECRET_HEADER));
        assertNull(downstreamRequest.getHeaders().getFirst(USER_NAME_HEADER));
    }

    @Test
    void validToken_InjectsDownstreamHeaders() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/boards")
                .header(HttpHeaders.AUTHORIZATION, "Bearer valid-token")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        when(jwtUtil.validateToken("valid-token")).thenReturn(null);
        when(jwtUtil.extractSubject("valid-token")).thenReturn("user@example.com");
        when(jwtUtil.extractRole("valid-token")).thenReturn("MEMBER");
        when(jwtUtil.extractUserId("valid-token")).thenReturn("42");

        GatewayFilter filter = authenticationFilter.apply(new AuthenticationFilter.Config());
        filter.filter(exchange, filterChain).block();

        ArgumentCaptor<ServerWebExchange> exchangeCaptor = ArgumentCaptor.forClass(ServerWebExchange.class);
        verify(filterChain).filter(exchangeCaptor.capture());

        ServerHttpRequest downstreamRequest = exchangeCaptor.getValue().getRequest();
        assertEquals(GATEWAY_SECRET, downstreamRequest.getHeaders().getFirst(INTERNAL_SECRET_HEADER));
        assertEquals("user@example.com", downstreamRequest.getHeaders().getFirst(USER_NAME_HEADER));
        assertEquals("MEMBER", downstreamRequest.getHeaders().getFirst(USER_ROLES_HEADER));
        assertEquals("42", downstreamRequest.getHeaders().getFirst(USER_ID_HEADER));
    }
}
