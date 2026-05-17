package com.flowboard.checklist.security;

import com.flowboard.checklist.client.BoardClient;
import com.flowboard.checklist.client.CardClient;
import com.flowboard.checklist.service.ChecklistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Slf4j
@Component("checklistSecurity")
@RequiredArgsConstructor
public class ChecklistSecurity {

    private final BoardClient boardClient;
    private final CardClient cardClient;
    private final ChecklistService checklistService;

    @Value("${gateway.secret}")
    private String gatewaySecret;

    public boolean isBoardMemberByCardId(Long cardId, Long userId) {
        if (userId == null) return false;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PLATFORM_ADMIN"))) {
            return true;
        }

        try {
            Long boardId = cardClient.getBoardId(cardId, gatewaySecret);
            return Boolean.TRUE.equals(boardClient.checkMembership(boardId, userId, gatewaySecret).getBody());
        } catch (Exception e) {
            log.error("Error checking board membership via card: cardId={}, userId={}", cardId, userId, e);
            return false;
        }
    }

    public boolean canModifyChecklist(Long checklistId, Long userId) {
        try {
            Long cardId = checklistService.getCardIdByChecklistId(checklistId);
            return isBoardMemberByCardId(cardId, userId);
        } catch (Exception e) {
            return false;
        }
    }
}
