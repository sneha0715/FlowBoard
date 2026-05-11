package com.flowboard.workspace.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.flowboard.workspace.dto.request.MemberRequest;
import com.flowboard.workspace.dto.request.WorkspaceRequest;
import com.flowboard.workspace.dto.response.ApiResponse;
import com.flowboard.workspace.dto.response.WorkspaceMemberResponse;
import com.flowboard.workspace.dto.response.WorkspaceResponse;
import com.flowboard.workspace.mapper.WorkspaceMemberMapper;
import com.flowboard.workspace.service.WorkspaceService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {
    private final WorkspaceService workspaceService;
    private final WorkspaceMemberMapper workspaceMemberMapper;

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<WorkspaceResponse>> createWorkspace(@Valid @RequestBody WorkspaceRequest request,
            HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        if (userId != null) {
            request.setOwnerId(userId.intValue());
        }
        WorkspaceResponse response = workspaceService.createWorkspace(request);
        return ResponseEntity
                .ok(ApiResponse.success(response, "Workspace created successfully", httpRequest.getRequestURI()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@workspaceSecurity.isPublicOrMember(#id, #requesterId)")
    public ResponseEntity<ApiResponse<WorkspaceResponse>> getWorkspaceById(
            @PathVariable int id,
            @RequestAttribute(value = "userId", required = false) Long requesterId,
            HttpServletRequest httpRequest) {
        WorkspaceResponse response = workspaceService.getById(id);
        return ResponseEntity
                .ok(ApiResponse.success(response, "Workspace fetched successfully", httpRequest.getRequestURI()));
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<ApiResponse<List<WorkspaceResponse>>> getByOwnerId(@PathVariable int ownerId,
            HttpServletRequest httpRequest) {
        // Only owner or admin can see their own list? Or any authenticated user?
        // Usually, users only see their own.
        List<WorkspaceResponse> response = workspaceService.getByOwnerID(ownerId);
        return ResponseEntity
                .ok(ApiResponse.success(response, "Workspaces fetched successfully", httpRequest.getRequestURI()));
    }

    @GetMapping("/member/{userId}")
    public ResponseEntity<ApiResponse<List<WorkspaceResponse>>> getByMemberId(@PathVariable int userId,
            HttpServletRequest httpRequest) {
        List<WorkspaceResponse> response = workspaceService.getByMember(userId);
        return ResponseEntity
                .ok(ApiResponse.success(response, "Workspaces fetched successfully", httpRequest.getRequestURI()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@workspaceSecurity.hasWorkspaceRole(#id, #requesterId, 'ADMIN')")
    public ResponseEntity<ApiResponse<WorkspaceResponse>> updateWorkspace(
            @PathVariable int id,
            @Valid @RequestBody WorkspaceRequest request,
            @RequestAttribute(value = "userId", required = false) Long requesterId,
            HttpServletRequest httpRequest) {
        WorkspaceResponse response = workspaceService.updateWorkspace(id, request);
        return ResponseEntity
                .ok(ApiResponse.success(response, "Workspace updated successfully", httpRequest.getRequestURI()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@workspaceSecurity.hasWorkspaceRole(#id, #requesterId, 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteWorkspace(
            @PathVariable int id,
            @RequestAttribute(value = "userId", required = false) Long requesterId,
            HttpServletRequest httpRequest) {
        workspaceService.deleteWorkspace(id);
        return ResponseEntity
                .ok(ApiResponse.success(null, "Workspace deleted successfully", httpRequest.getRequestURI()));
    }

    @PostMapping("/{workspaceId}/members/add")
    @PreAuthorize("@workspaceSecurity.hasWorkspaceRole(#workspaceId, #requesterId, 'ADMIN')")
    public ResponseEntity<ApiResponse<WorkspaceMemberResponse>> addMember(
            @PathVariable int workspaceId,
            @Valid @RequestBody MemberRequest request,
            @RequestAttribute(value = "userId", required = false) Long requesterId,
            HttpServletRequest httpRequest) {
        WorkspaceMemberResponse response = workspaceService.addMember(workspaceId, request.getUserId(), request.getRole());
        return ResponseEntity
                .ok(ApiResponse.success(response, "Member added successfully", httpRequest.getRequestURI()));
    }


    @DeleteMapping("/{workspaceId}/members/remove/{userId}")
    @PreAuthorize("@workspaceSecurity.hasWorkspaceRole(#workspaceId, #requesterId, 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable int workspaceId,
            @PathVariable int userId,
            @RequestAttribute(value = "userId", required = false) Long requesterId,
            HttpServletRequest httpRequest) {
        workspaceService.removeMember(userId, workspaceId);
        return ResponseEntity.ok(ApiResponse.success(null, "Member removed successfully", httpRequest.getRequestURI()));
    }

    @PutMapping("/{workspaceId}/members/role")
    @PreAuthorize("@workspaceSecurity.hasWorkspaceRole(#workspaceId, #requesterId, 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> updateMemberRole(
            @PathVariable int workspaceId,
            @RequestParam int userId,
            @RequestParam String role,
            @RequestAttribute(value = "userId", required = false) Long requesterId,
            HttpServletRequest httpRequest) {
        workspaceService.updateMemberRole(userId, workspaceId, role);
        return ResponseEntity
                .ok(ApiResponse.success(null, "Member role updated successfully", httpRequest.getRequestURI()));
    }

    @GetMapping("/{workspaceId}/members")
    @PreAuthorize("@workspaceSecurity.isMember(#workspaceId, #requesterId)")
    public ResponseEntity<ApiResponse<List<WorkspaceMemberResponse>>> getMembers(
            @PathVariable int workspaceId,
            @RequestAttribute(value = "userId", required = false) Long requesterId,
            HttpServletRequest httpRequest) {
        List<WorkspaceMemberResponse> response = workspaceService.getMembers(workspaceId).stream()
                .map(workspaceMemberMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity
                .ok(ApiResponse.success(response, "Members fetched successfully", httpRequest.getRequestURI()));
    }

    @GetMapping("/{workspaceId}/members/{userId}/role")
    public java.util.Map<String, String> getRole(@PathVariable int workspaceId, @PathVariable int userId) {
        return java.util.Map.of("role", workspaceService.getMemberRole(userId, workspaceId));
    }

    @PostMapping("/{workspaceId}/accept")
    public ResponseEntity<ApiResponse<Void>> acceptInvitation(
            @PathVariable int workspaceId,
            @RequestAttribute("userId") Long userId,
            HttpServletRequest httpRequest) {
        workspaceService.acceptMember(workspaceId, userId.intValue());
        return ResponseEntity.ok(ApiResponse.success(null, "Invitation accepted", httpRequest.getRequestURI()));
    }

    @GetMapping("/invitations/pending")
    public ResponseEntity<ApiResponse<List<WorkspaceMemberResponse>>> getPendingInvitations(
            @RequestAttribute("userId") Long userId,
            HttpServletRequest httpRequest) {
        List<WorkspaceMemberResponse> response = workspaceService.getPendingInvitations(userId.intValue());
        return ResponseEntity.ok(ApiResponse.success(response, "Pending invitations fetched", httpRequest.getRequestURI()));
    }

    @PostMapping("/{workspaceId}/leave")
    public ResponseEntity<ApiResponse<Void>> leaveWorkspace(
            @PathVariable int workspaceId,
            @RequestAttribute("userId") Long userId,
            HttpServletRequest httpRequest) {
        workspaceService.removeMember(userId.intValue(), workspaceId);
        return ResponseEntity.ok(ApiResponse.success(null, "Left workspace", httpRequest.getRequestURI()));
    }
}
