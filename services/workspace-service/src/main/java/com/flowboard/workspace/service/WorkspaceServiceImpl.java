package com.flowboard.workspace.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flowboard.workspace.dto.request.WorkspaceRequest;
import com.flowboard.workspace.dto.response.WorkspaceResponse;
import com.flowboard.workspace.dto.response.WorkspaceMemberResponse;
import com.flowboard.workspace.exception.CustomException;
import java.util.stream.Collectors;
import com.flowboard.workspace.exception.MemberAlreadyExistsException;
import com.flowboard.workspace.exception.ResourceNotFoundException;
import com.flowboard.workspace.exception.WorkspaceAlreadyExistsException;
import com.flowboard.workspace.mapper.WorkspaceMapper;
import com.flowboard.workspace.mapper.WorkspaceMemberMapper;
import com.flowboard.workspace.model.Workspace;
import com.flowboard.workspace.model.WorkspaceMember;
import com.flowboard.workspace.repository.WorkspaceMemberRepository;
import com.flowboard.workspace.repository.WorkspaceRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkspaceServiceImpl implements WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final WorkspaceMapper workspaceMapper;
    private final WorkspaceMemberMapper workspaceMemberMapper;

    @Override
    @Transactional
    public WorkspaceResponse createWorkspace(WorkspaceRequest request) {
        if (request.getOwnerId() == null) {
            log.warn("Workspace creation failed — ownerId is null");
            throw new CustomException("Owner ID is required for workspace creation", org.springframework.http.HttpStatus.BAD_REQUEST);
        }

        if (workspaceRepository.existsByNameAndOwnerId(request.getName(), request.getOwnerId())) {
            log.warn("Workspace already exists: name={}, ownerId={}", request.getName(), request.getOwnerId());
            throw new WorkspaceAlreadyExistsException("Workspace with this name already exists for this owner");
        }

        Workspace workspace = workspaceMapper.toEntity(request);
        Workspace savedWorkspace = workspaceRepository.save(workspace);

        WorkspaceMember ownerMember = WorkspaceMember.builder()
                .workspace(savedWorkspace)
                .userId(request.getOwnerId())
                .role("OWNER")
                .build();
        workspaceMemberRepository.save(ownerMember);

        log.info("Workspace created: id={}, name={}, owner={}", savedWorkspace.getWorkspaceId(), savedWorkspace.getName(), request.getOwnerId());
        return workspaceMapper.toResponse(savedWorkspace);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkspaceResponse getById(int workspaceId) {
        return workspaceRepository.findById(workspaceId)
                .map(workspaceMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with id: " + workspaceId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkspaceResponse> getByOwnerID(int ownerId) {
        List<Workspace> workspaces = workspaceRepository.findByOwnerId(ownerId);
        if (workspaces.isEmpty()) {
            throw new ResourceNotFoundException("No workspaces found for owner id: " + ownerId);
        }
        return workspaces.stream().map(workspaceMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkspaceResponse> getByMember(int userId) {
        List<Workspace> workspaces = workspaceRepository.findByMembersUserId(userId);
        if (workspaces.isEmpty()) {
            throw new ResourceNotFoundException("No workspaces found for member id: " + userId);
        }
        return workspaces.stream().map(workspaceMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public WorkspaceResponse updateWorkspace(int workspaceId, WorkspaceRequest request) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        workspace.setName(request.getName());
        workspace.setDescription(request.getDescription());
        workspace.setVisibility(request.getVisibility());
        workspace.setLogoUrl(request.getLogoUrl());

        WorkspaceResponse response = workspaceMapper.toResponse(workspaceRepository.save(workspace));
        log.info("Workspace updated: id={}", workspaceId);
        return response;
    }

    @Override
    @Transactional
    public void deleteWorkspace(int workspaceId) {
        if (!workspaceRepository.existsById(workspaceId)) {
            throw new ResourceNotFoundException("Workspace not found");
        }
        workspaceRepository.deleteById(workspaceId);
        log.info("Workspace deleted: id={}", workspaceId);
    }

    @Override
    @Transactional
    public WorkspaceMemberResponse addMember(int workspaceId, int userId, String role) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        if (workspaceMemberRepository.findByWorkspaceWorkspaceIdAndUserId(workspaceId, userId).isPresent()) {
            log.warn("Add member failed — userId={} already in workspace={}", userId, workspaceId);
            throw new MemberAlreadyExistsException("User is already a member of this workspace");
        }

        WorkspaceMember member = WorkspaceMember.builder()
                .workspace(workspace)
                .userId(userId)
                .role(role)
                .build();

        WorkspaceMemberResponse response = workspaceMemberMapper.toResponse(workspaceMemberRepository.save(member));
        log.info("Member added: userId={}, workspaceId={}, role={}", userId, workspaceId, role);
        return response;
    }

    @Override
    @Transactional
    public void removeMember(int userId, int workspaceId) {
        if (!workspaceMemberRepository.findByWorkspaceWorkspaceIdAndUserId(workspaceId, userId).isPresent()) {
            throw new ResourceNotFoundException("Member not found in this workspace");
        }
        workspaceMemberRepository.deleteByWorkspaceWorkspaceIdAndUserId(workspaceId, userId);
        log.info("Member removed: userId={}, workspaceId={}", userId, workspaceId);
    }

    @Override
    @Transactional
    public void updateMemberRole(int userId, int workspaceId, String role) {
        WorkspaceMember member = workspaceMemberRepository.findByWorkspaceWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));
        member.setRole(role);
        workspaceMemberRepository.save(member);
        log.info("Member role updated: userId={}, workspaceId={}, role={}", userId, workspaceId, role);
    }

    @Override
    public List<WorkspaceMember> getMembers(int workspaceId) {
        return workspaceMemberRepository.findByWorkspaceWorkspaceId(workspaceId);
    }
}
