package com.flowboard.workspace.service;

import java.util.List;

import com.flowboard.workspace.dto.request.WorkspaceRequest;
import com.flowboard.workspace.dto.response.WorkspaceResponse;
import com.flowboard.workspace.dto.response.WorkspaceMemberResponse;
import com.flowboard.workspace.model.WorkspaceMember;

public interface WorkspaceService {
    WorkspaceResponse createWorkspace(WorkspaceRequest request);

    WorkspaceResponse getById(int workspaceId);

    List<WorkspaceResponse> getByOwnerID(int ownerId);

    List<WorkspaceResponse> getByMember(int userId);

    WorkspaceResponse updateWorkspace(int workspaceId, WorkspaceRequest request);

    void deleteWorkspace(int workspaceId);

    WorkspaceMemberResponse addMember(int workspaceId, int userId, String role);

    void removeMember(int userId, int workspaceId);

    void updateMemberRole(int userId, int workspaceId, String role);

    List<WorkspaceMember> getMembers(int workspaceId);

}
