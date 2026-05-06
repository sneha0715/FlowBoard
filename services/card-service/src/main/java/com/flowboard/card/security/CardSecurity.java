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

    @Value("${gateway.secret:FlowBoardGateway2024}")
    private String gatewaySecret;

    public boolean hasBoardRole(Long boardId, Long userId, String... allowedRoles) {
        if (userId == null) return false;

        // Platform Admin bypass
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PLATFORM_ADMIN"))) {
            return true;
        }

        try {
            String role = boardClient.getRole(boardId, userId, gatewaySecret).getBody();
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
        try {
            Long boardId = cardService.getBoardIdByCardId(cardId);
            return hasBoardRole(boardId, userId, "ADMIN", "MEMBER");
        } catch (Exception e) {
            return false;
        }
    }
}
