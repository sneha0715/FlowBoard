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

    public boolean isPublicOrMember(Long boardId, Long userId) {
        // Check if public
        boolean isPublic = boardRepository.findById(boardId)
                .map(board -> "PUBLIC".equalsIgnoreCase(board.getVisibility()))
                .orElse(false);
        if (isPublic) return true;

        return isMember(boardId, userId);
    }

    public boolean hasBoardRole(Long boardId, Long userId, String... allowedRoles) {
        if (userId == null) return false;

        // Global Admin bypass
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PLATFORM_ADMIN"))) {
            return true;
        }

        return boardMemberRepository.findByBoardIdAndUserId(boardId, userId)
                .map(member -> {
                    String role = member.getRole();
                    return Arrays.asList(allowedRoles).contains(role);
                })
                .orElse(false);
    }

    public boolean isMember(Long boardId, Long userId) {
        if (userId == null) return false;

        // Global Admin bypass
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PLATFORM_ADMIN"))) {
            return true;
        }

        return boardMemberRepository.existsByBoardIdAndUserId(boardId, userId);
    }
}
