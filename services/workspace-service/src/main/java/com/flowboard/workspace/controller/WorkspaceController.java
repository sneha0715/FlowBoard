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
import org.springframework.web.bind.annotation.RestController;

import com.flowboard.workspace.dto.request.MemberRequest;
import com.flowboard.workspace.dto.request.WorkspaceRequest;
import com.flowboard.workspace.dto.response.ApiResponse;
import com.flowboard.workspace.dto.response.WorkspaceMemberResponse;
import com.flowboard.workspace.dto.response.WorkspaceResponse;
import com.flowboard.workspace.mapper.WorkspaceMapper;
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
    private final WorkspaceMapper workspaceMapper;
    private final WorkspaceMemberMapper workspaceMemberMapper;

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<WorkspaceResponse>> createWorkspace(@Valid @RequestBody WorkspaceRequest request,
            HttpServletRequest httpRequest) {
        WorkspaceResponse response = workspaceService.createWorkspace(request);
        return ResponseEntity
                .ok(ApiResponse.success(response, "Workspace created successfully", httpRequest.getRequestURI()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkspaceResponse>> getWorkspaceById(@PathVariable int id,
            HttpServletRequest httpRequest) {
        WorkspaceResponse response = workspaceService.getById(id);
        return ResponseEntity
                .ok(ApiResponse.success(response, "Workspace fetched successfully", httpRequest.getRequestURI()));
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<ApiResponse<List<WorkspaceResponse>>> getByOwnerId(@PathVariable int ownerId,
            HttpServletRequest httpRequest) {
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
    public ResponseEntity<ApiResponse<WorkspaceResponse>> updateWorkspace(@PathVariable int id,
            @Valid @RequestBody WorkspaceRequest request, HttpServletRequest httpRequest) {
        WorkspaceResponse response = workspaceService.updateWorkspace(id, request);
        return ResponseEntity
                .ok(ApiResponse.success(response, "Workspace updated successfully", httpRequest.getRequestURI()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWorkspace(@PathVariable int id, HttpServletRequest httpRequest) {
        workspaceService.deleteWorkspace(id);
        return ResponseEntity
                .ok(ApiResponse.success(null, "Workspace deleted successfully", httpRequest.getRequestURI()));
    }

    @PostMapping("/{workspaceId}/members/add")
    public ResponseEntity<ApiResponse<WorkspaceMemberResponse>> addMember(@PathVariable int workspaceId,
            @Valid @RequestBody MemberRequest request, HttpServletRequest httpRequest) {
        WorkspaceMemberResponse response = workspaceService.addMember(workspaceId, request.getUserId(), request.getRole());
        return ResponseEntity
                .ok(ApiResponse.success(response, "Member added successfully", httpRequest.getRequestURI()));
    }

    @DeleteMapping("/{workspaceId}/members/remove/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(@PathVariable int workspaceId, @PathVariable int userId,
            HttpServletRequest httpRequest) {
        workspaceService.removeMember(userId, workspaceId);
        return ResponseEntity.ok(ApiResponse.success(null, "Member removed successfully", httpRequest.getRequestURI()));
    }

    @PutMapping("/{workspaceId}/members/role")
    public ResponseEntity<ApiResponse<Void>> updateMemberRole(@PathVariable int workspaceId, @RequestParam int userId,
            @RequestParam String role, HttpServletRequest httpRequest) {
        workspaceService.updateMemberRole(userId, workspaceId, role);
        return ResponseEntity
                .ok(ApiResponse.success(null, "Member role updated successfully", httpRequest.getRequestURI()));
    }

    @GetMapping("/{workspaceId}/members")
    public ResponseEntity<ApiResponse<List<WorkspaceMemberResponse>>> getMembers(@PathVariable int workspaceId,
            HttpServletRequest httpRequest) {
        List<WorkspaceMemberResponse> response = workspaceService.getMembers(workspaceId).stream()
                .map(workspaceMemberMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity
                .ok(ApiResponse.success(response, "Members fetched successfully", httpRequest.getRequestURI()));
    }
}
