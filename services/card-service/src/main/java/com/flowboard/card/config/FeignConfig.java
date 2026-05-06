package com.flowboard.card.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Configuration
public class FeignConfig {

    private static final String GATEWAY_SECRET_HEADER = "X-Internal-Gateway-Secret";
    private static final String USER_NAME_HEADER      = "X-User-Name";
    private static final String USER_ROLES_HEADER     = "X-User-Roles";
    private static final String USER_ID_HEADER        = "X-User-Id";

    @Bean
    public RequestInterceptor requestInterceptor() {
        return requestTemplate -> {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                
                // Propagate headers from current request
                copyHeader(request, requestTemplate, GATEWAY_SECRET_HEADER);
                copyHeader(request, requestTemplate, USER_NAME_HEADER);
                copyHeader(request, requestTemplate, USER_ROLES_HEADER);
                copyHeader(request, requestTemplate, USER_ID_HEADER);
            }
        };
    }

    private void copyHeader(HttpServletRequest request, RequestTemplate template, String headerName) {
        String value = request.getHeader(headerName);
        if (value != null && !value.isBlank()) {
            template.header(headerName, value);
        }
    }
}
