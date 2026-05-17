package com.flowboard.workspace.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.flowboard.workspace.dto.request.WorkspaceRequest;
import com.flowboard.workspace.dto.response.WorkspaceResponse;
import com.flowboard.workspace.exception.ResourceNotFoundException;
import com.flowboard.workspace.mapper.WorkspaceMapper;
import com.flowboard.workspace.mapper.WorkspaceMemberMapper;
import com.flowboard.workspace.model.Workspace;
import com.flowboard.workspace.repository.WorkspaceMemberRepository;
import com.flowboard.workspace.repository.WorkspaceRepository;

@ExtendWith(MockitoExtension.class)
class WorkspaceServiceImplTest {

    @Mock
    private WorkspaceRepository workspaceRepository;
    @Mock
    private WorkspaceMemberRepository workspaceMemberRepository;
    @Mock
    private WorkspaceMapper workspaceMapper;
    @Mock
    private WorkspaceMemberMapper workspaceMemberMapper;

    @InjectMocks
    private WorkspaceServiceImpl workspaceService;

    private Workspace testWorkspace;
    private WorkspaceRequest workspaceRequest;
    private WorkspaceResponse workspaceResponse;

    @BeforeEach
    void setUp() {
        testWorkspace = Workspace.builder()
                .workspaceId(1)
                .name("Test WS")
                .ownerId(10)
                .build();

        workspaceRequest = new WorkspaceRequest();
        workspaceRequest.setName("Test WS");
        workspaceRequest.setOwnerId(10);

        workspaceResponse = new WorkspaceResponse();
        workspaceResponse.setWorkspaceId(1);
        workspaceResponse.setName("Test WS");
    }

    @Test
    void createWorkspace_Success() {
        when(workspaceRepository.existsByNameAndOwnerId(anyString(), anyInt())).thenReturn(false);
        when(workspaceMapper.toEntity(any())).thenReturn(testWorkspace);
        when(workspaceRepository.save(any())).thenReturn(testWorkspace);
        when(workspaceMapper.toResponse(any())).thenReturn(workspaceResponse);

        WorkspaceResponse created = workspaceService.createWorkspace(workspaceRequest);

        assertNotNull(created);
        assertEquals("Test WS", created.getName());
        verify(workspaceRepository).save(any());
        verify(workspaceMemberRepository).save(any());
    }

    @Test
    void getById_Success() {
        when(workspaceRepository.findById(1)).thenReturn(Optional.of(testWorkspace));
        when(workspaceMapper.toResponse(testWorkspace)).thenReturn(workspaceResponse);

        WorkspaceResponse found = workspaceService.getById(1);

        assertNotNull(found);
        assertEquals(1, found.getWorkspaceId());
    }

    @Test
    void getById_NotFound_ThrowsException() {
        when(workspaceRepository.findById(1)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            workspaceService.getById(1);
        });
    }
}
