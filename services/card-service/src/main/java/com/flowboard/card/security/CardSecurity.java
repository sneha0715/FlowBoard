package com.flowboard.card.security;

import com.flowboard.card.client.BoardClient;
import com.flowboard.card.service.CardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Slf4j
@Component("cardSecurity")
@RequiredArgsConstructor
public class CardSecurity {

    private final BoardClient boardClient;
    private final CardService cardService;

    @Value("${gateway.secret}")
    private String gatewaySecret;

    public boolean hasBoardRole(Long boardId, Long userId, String... allowedRoles) {
        if (userId == null) {
            log.warn("SECURITY DENIED: userId is null");
            return false;
        }

        // Platform Admin bypass
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PLATFORM_ADMIN"))) {
            log.info("SECURITY BYPASS: Platform Admin detected");
            return true;
        }

        try {
            log.info("SECURITY: Fetching role from BoardService for boardId={}, userId={}", boardId, userId);
            var response = boardClient.getRole(boardId, userId, gatewaySecret);
            log.info("SECURITY: BoardService Response Status: {}", response.getStatusCode());
            java.util.Map<String, String> result = response.getBody();
            String role = result != null ? result.get("role") : null;
            log.info("SECURITY: Detected Board Role: {}", role);
            boolean allowed = role != null && Arrays.asList(allowedRoles).contains(role);
            if (!allowed) log.warn("SECURITY DENIED: Role '{}' not in allowed list {}", role, allowedRoles);
            return allowed;
        } catch (Exception e) {
            log.error("SECURITY CRITICAL: BoardService communication failed for boardId={}, userId={}", boardId, userId, e);
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

    public boolean canAccessCard(Long cardId, Long userId) {
        // Need to get boardId from cardId
        // This is tricky if we don't want to call cardService inside security (circular dep?)
        // Actually, cardService is already a field here.
        try {
            Long boardId = cardService.getBoardIdByCardId(cardId);
            return isBoardMember(boardId, userId);
        } catch (Exception e) {
            return false;
        }
    }

    public boolean canModifyCard(Long cardId, Long userId) {
        log.info("SECURITY: Checking modify permission for cardId={}, userId={}", cardId, userId);
        try {
            Long boardId = cardService.getBoardIdByCardId(cardId);
            boolean allowed = hasBoardRole(boardId, userId, "ADMIN", "MEMBER");
            log.info("SECURITY: Access for cardId={} is {}", cardId, allowed ? "GRANTED" : "DENIED");
            return allowed;
        } catch (Exception e) {
            log.error("SECURITY FAILURE: Error checking card permissions for cardId={}", cardId, e);
            return false;
        }
    }
}
