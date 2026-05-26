package com.flowboard.apigateway.filter;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.core.Ordered;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@ExtendWith(MockitoExtension.class)
class GatewayLoggingFilterTest {

    @Mock
    private GatewayFilterChain filterChain;

    private GatewayLoggingFilter gatewayLoggingFilter;

    @BeforeEach
    void setUp() {
        gatewayLoggingFilter = new GatewayLoggingFilter();
    }

    @Test
    void testGetOrder_ReturnsLowestPrecedence() {
        assertEquals(Ordered.LOWEST_PRECEDENCE, gatewayLoggingFilter.getOrder());
    }

    @Test
    void testFilter_LogsAndProceedsDownChain() {
        MockServerHttpRequest request = MockServerHttpRequest.method(HttpMethod.GET, "/api/boards")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        exchange.getResponse().setStatusCode(HttpStatus.OK);

        when(filterChain.filter(any(ServerWebExchange.class))).thenReturn(Mono.empty());

        Mono<Void> result = gatewayLoggingFilter.filter(exchange, filterChain);
        
        // Assert that Mono completes cleanly
        assertNull(result.block());

        // Verify that it went down the chain
        verify(filterChain).filter(exchange);
    }
}
