package com.flowboard.workspace.service;

import java.util.List;

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
            log.info("Workspace already exists, returning existing: name={}, ownerId={}", request.getName(), request.getOwnerId());
            return workspaceMapper.toResponse(workspaceRepository.findByNameAndOwnerId(request.getName(), request.getOwnerId()));
        }

        Workspace workspace = workspaceMapper.toEntity(request);
        Workspace savedWorkspace = workspaceRepository.save(workspace);

        WorkspaceMember ownerMember = WorkspaceMember.builder()
                .workspace(savedWorkspace)
                .userId(request.getOwnerId())
                .role("OWNER")
                .status("ACCEPTED")
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
        // Use the proper repository query to avoid LazyInitializationException
        List<Workspace> workspaces = workspaceRepository.findAcceptedWorkspacesByUserId(userId);
        
        if (workspaces.isEmpty()) {
            // Log but don't throw exception if we want empty list instead of 404
            log.info("No active workspaces for userId={}", userId);
        }
        return workspaces.stream().map(workspaceMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkspaceResponse> getPublicWorkspaces() {
        List<Workspace> workspaces = workspaceRepository.findByVisibility("PUBLIC");
        return workspaces.stream().map(workspaceMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkspaceResponse> getAllWorkspaces() {
        List<Workspace> workspaces = workspaceRepository.findAll();
        return workspaces.stream().map(workspaceMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkspaceMemberResponse> getPendingInvitations(int userId) {
        return workspaceMemberRepository.findByUserIdAndStatus(userId, "PENDING").stream()
                .map(workspaceMemberMapper::toResponse)
                .collect(Collectors.toList());
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

        java.util.Optional<WorkspaceMember> existing = workspaceMemberRepository.findByWorkspaceWorkspaceIdAndUserId(workspaceId, userId);
        if (existing.isPresent()) {
            log.info("Member already exists, returning existing: userId={}, workspaceId={}", userId, workspaceId);
            return workspaceMemberMapper.toResponse(existing.get());
        }

        WorkspaceMember member = WorkspaceMember.builder()
                .workspace(workspace)
                .userId(userId)
                .role(role)
                .status("PENDING") // Default to pending for invitations
                .build();

        WorkspaceMemberResponse response = workspaceMemberMapper.toResponse(workspaceMemberRepository.save(member));
        log.info("Invitation sent: userId={}, workspaceId={}, role={}", userId, workspaceId, role);
        return response;
    }

    @Override
    @Transactional
    public void acceptMember(int workspaceId, int userId) {
        WorkspaceMember member = workspaceMemberRepository.findByWorkspaceWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found"));
        
        member.setStatus("ACCEPTED");
        workspaceMemberRepository.save(member);
        log.info("Invitation accepted: userId={}, workspaceId={}", userId, workspaceId);
    }

    @Override
    @Transactional
    public void removeMember(int userId, int workspaceId) {
        WorkspaceMember member = workspaceMemberRepository.findByWorkspaceWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in this workspace"));

        // Prevention: Don't allow removing the last ADMIN
        if ("ADMIN".equalsIgnoreCase(member.getRole()) || "OWNER".equalsIgnoreCase(member.getRole())) {
            long adminCount = workspaceMemberRepository.findByWorkspaceWorkspaceId(workspaceId).stream()
                    .filter(m -> "ADMIN".equalsIgnoreCase(m.getRole()) || "OWNER".equalsIgnoreCase(m.getRole()))
                    .count();
            if (adminCount <= 1) {
                throw new CustomException("Cannot remove the last administrator of the workspace", org.springframework.http.HttpStatus.BAD_REQUEST);
            }
        }

        workspaceMemberRepository.deleteByWorkspaceWorkspaceIdAndUserId(workspaceId, userId);
        log.info("Member removed: userId={}, workspaceId={}", userId, workspaceId);
    }

    @Override
    @Transactional
    public void updateMemberRole(int userId, int workspaceId, String role) {
        WorkspaceMember member = workspaceMemberRepository.findByWorkspaceWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        // Prevention: Don't allow demoting the last ADMIN to MEMBER/OBSERVER
        if (!"ADMIN".equalsIgnoreCase(role) && "ADMIN".equalsIgnoreCase(member.getRole())) {
            long adminCount = workspaceMemberRepository.findByWorkspaceWorkspaceId(workspaceId).stream()
                    .filter(m -> "ADMIN".equalsIgnoreCase(m.getRole()) || "OWNER".equalsIgnoreCase(m.getRole()))
                    .count();
            if (adminCount <= 1) {
                throw new CustomException("Cannot demote the last administrator of the workspace", org.springframework.http.HttpStatus.BAD_REQUEST);
            }
        }

        member.setRole(role);
        workspaceMemberRepository.save(member);
        log.info("Member role updated: userId={}, workspaceId={}, role={}", userId, workspaceId, role);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkspaceMemberResponse> getMembers(int workspaceId) {
        return workspaceMemberRepository.findByWorkspaceWorkspaceId(workspaceId).stream()
                .map(workspaceMemberMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public String getMemberRole(int userId, int workspaceId) {
        return workspaceMemberRepository.findByWorkspaceWorkspaceIdAndUserId(workspaceId, userId)
                .map(WorkspaceMember::getRole)
                .orElse("NONE");
    }
}
