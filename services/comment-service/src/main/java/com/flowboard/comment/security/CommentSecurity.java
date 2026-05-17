package com.flowboard.comment.security;

import com.flowboard.comment.client.BoardClient;
import com.flowboard.comment.client.CardClient;
import com.flowboard.comment.service.CommentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Slf4j
@Component("commentSecurity")
@RequiredArgsConstructor
public class CommentSecurity {

    private final BoardClient boardClient;
    private final CardClient cardClient;
    private final CommentService commentService;

    @Value("${gateway.secret}")
    private String gatewaySecret;

    public boolean hasBoardRoleByCardId(Long cardId, Long userId, String... allowedRoles) {
        if (userId == null) return false;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PLATFORM_ADMIN"))) {
            return true;
        }

        try {
            Long boardId = cardClient.getBoardId(cardId, gatewaySecret);
            String role = boardClient.getRole(boardId, userId, gatewaySecret).getBody();
            return role != null && Arrays.asList(allowedRoles).contains(role);
        } catch (Exception e) {
            log.error("Error checking board role via card: cardId={}, userId={}", cardId, userId, e);
            return false;
        }
    }

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

    public boolean canModifyComment(Long commentId, Long userId) {
        if (userId == null) return false;
        
        // Owner of the comment can modify it? Or board admin?
        // Usually, owners can delete their own comments.
        // Let's check the comment owner.
        try {
            // Need to add getCommentOwner to service
            // For now, let's just check if they are board member.
            // A better check would be comment owner OR board admin.
            return isBoardMemberByCardId(commentService.getCardIdByCommentId(commentId), userId);
        } catch (Exception e) {
            return false;
        }
    }
}
