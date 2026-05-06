package com.flowboard.workspace.security;

import com.flowboard.workspace.repository.WorkspaceMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component("workspaceSecurity")
@RequiredArgsConstructor
public class WorkspaceSecurity {

    private final WorkspaceMemberRepository workspaceMemberRepository;

    private final com.flowboard.workspace.repository.WorkspaceRepository workspaceRepository;

    public boolean isPublicOrMember(int workspaceId, Long userId) {
        // Check if public
        boolean isPublic = workspaceRepository.findById(workspaceId)
                .map(ws -> "PUBLIC".equalsIgnoreCase(ws.getVisibility()))
                .orElse(false);
        if (isPublic) return true;

        return isMember(workspaceId, userId);
    }

    public boolean hasWorkspaceRole(int workspaceId, Long userId, String... allowedRoles) {
        if (userId == null) return false;

        // Global Admin bypass
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PLATFORM_ADMIN"))) {
            return true;
        }

        return workspaceMemberRepository.findByWorkspaceWorkspaceIdAndUserId(workspaceId, userId.intValue())
                .map(member -> {
                    String role = member.getRole();
                    // If OWNER is the role, they should have any privilege (Admin or Member)
                    if ("OWNER".equalsIgnoreCase(role)) return true;
                    return Arrays.asList(allowedRoles).contains(role);
                })
                .orElse(false);
    }

    public boolean isMember(int workspaceId, Long userId) {
        if (userId == null) return false;

        // Global Admin bypass
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PLATFORM_ADMIN"))) {
            return true;
        }

        return workspaceMemberRepository.findByWorkspaceWorkspaceIdAndUserId(workspaceId, userId.intValue()).isPresent();
    }
}
