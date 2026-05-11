package com.flowboard.board.security;

import com.flowboard.board.repository.BoardMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Slf4j
@Component("boardSecurity")
@RequiredArgsConstructor
public class BoardSecurity {

    private final BoardMemberRepository boardMemberRepository;

    private final com.flowboard.board.repository.BoardRepository boardRepository;
    private final com.flowboard.board.client.WorkspaceClient workspaceClient;

    @org.springframework.beans.factory.annotation.Value("${gateway.secret:FlowBoardGateway2024}")
    private String gatewaySecret;

    public boolean isPublicOrMember(Long boardId, Long userId) {
        if (userId == null) return false;
        
        // 1. Check if public
        boolean isPublic = boardRepository.findById(boardId)
                .map(board -> "PUBLIC".equalsIgnoreCase(board.getVisibility()))
                .orElse(false);
        if (isPublic) return true;

        // 2. Check if platform admin
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PLATFORM_ADMIN"))) {
            return true;
        }

        // 3. Check board membership
        if (boardMemberRepository.existsByBoardIdAndUserId(boardId, userId)) {
            return true;
        }

        // 4. Check workspace-level bypass (OWNER/ADMIN/MEMBER)
        return boardRepository.findById(boardId)
                .map(board -> {
                    if (board.getWorkspaceId() == null) return false;
                    try {
                        java.util.Map<String, String> result = workspaceClient.getMemberRole(board.getWorkspaceId().intValue(), userId.intValue(), gatewaySecret);
                        String role = result != null ? result.get("role") : null;
                        // If they have ANY role in the workspace, they can see the boards
                        return role != null && !role.equalsIgnoreCase("NONE");
                    } catch (Exception e) {
                        log.error("Failed to check workspace role for userId={} in workspace={}", userId, board.getWorkspaceId());
                        return false;
                    }
                })
                .orElse(false);
    }

    public boolean hasBoardRole(Long boardId, Long userId, String... allowedRoles) {
        if (userId == null) return false;

        // 1. Platform Admin bypass
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PLATFORM_ADMIN"))) {
            return true;
        }

        // 2. Board-level role check
        boolean hasBoardRole = boardMemberRepository.findByBoardIdAndUserId(boardId, userId)
                .map(member -> Arrays.asList(allowedRoles).contains(member.getRole()))
                .orElse(false);
        if (hasBoardRole) return true;

        // 3. Workspace-level bypass (OWNER/ADMIN are treated as board ADMINS)
        return boardRepository.findById(boardId)
                .map(board -> {
                    if (board.getWorkspaceId() == null) return false;
                    try {
                        java.util.Map<String, String> result = workspaceClient.getMemberRole(board.getWorkspaceId().intValue(), userId.intValue(), gatewaySecret);
                        String role = result != null ? result.get("role") : null;
                        return "OWNER".equalsIgnoreCase(role) || "ADMIN".equalsIgnoreCase(role);
                    } catch (Exception e) {
                        return false;
                    }
                })
                .orElse(false);
    }

    public boolean isMember(Long boardId, Long userId) {
        return isPublicOrMember(boardId, userId);
    }
}
