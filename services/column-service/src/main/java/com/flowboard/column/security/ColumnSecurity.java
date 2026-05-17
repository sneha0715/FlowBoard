package com.flowboard.column.security;

import com.flowboard.column.client.BoardClient;
import com.flowboard.column.service.ListService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Slf4j
@Component("columnSecurity")
@RequiredArgsConstructor
public class ColumnSecurity {

    private final BoardClient boardClient;
    private final ListService listService;

    @Value("${gateway.secret}")
    private String gatewaySecret;

    public boolean hasBoardRole(Long boardId, Long userId, String... allowedRoles) {
        if (userId == null) return false;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PLATFORM_ADMIN"))) {
            return true;
        }

        try {
            java.util.Map<String, String> result = boardClient.getRole(boardId, userId, gatewaySecret).getBody();
            String role = result != null ? result.get("role") : null;
            return role != null && Arrays.asList(allowedRoles).contains(role);
        } catch (Exception e) {
            log.error("Error checking board role: boardId={}, userId={}", boardId, userId, e);
            return false;
        }
    }

    public boolean isBoardMember(Long boardId, Long userId) {
        if (userId == null) return false;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PLATFORM_ADMIN"))) {
            return true;
        }

        try {
            return Boolean.TRUE.equals(boardClient.checkMembership(boardId, userId, gatewaySecret).getBody());
        } catch (Exception e) {
            log.error("Error checking board membership: boardId={}, userId={}", boardId, userId, e);
            return false;
        }
    }

    public boolean isPublicOrMember(Long boardId, Long userId) {
        if (userId != null && isBoardMember(boardId, userId)) {
            return true;
        }
        try {
            java.util.Map<String, Object> result = boardClient.getById(boardId, gatewaySecret).getBody();
            if (result != null) {
                java.util.Map<String, Object> data = (java.util.Map<String, Object>) result.get("data");
                String visibility = data != null ? (String) data.get("visibility") : null;
                return "PUBLIC".equalsIgnoreCase(visibility);
            }
        } catch (Exception e) {
            log.error("Error checking board visibility: boardId={}", boardId, e);
        }
        return false;
    }

    public boolean canModifyList(Long listId, Long userId) {
        try {
            Long boardId = listService.getBoardIdByListId(listId);
            return hasBoardRole(boardId, userId, "ADMIN", "MEMBER");
        } catch (Exception e) {
            return false;
        }
    }
}
