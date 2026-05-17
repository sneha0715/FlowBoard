package com.flowboard.checklist.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.flowboard.checklist.dto.request.ChecklistRequest;
import com.flowboard.checklist.dto.response.ChecklistResponse;
import com.flowboard.checklist.entity.Checklist;
import com.flowboard.checklist.exception.ResourceNotFoundException;
import com.flowboard.checklist.mapper.ChecklistMapper;
import com.flowboard.checklist.repository.ChecklistRepository;

@ExtendWith(MockitoExtension.class)
class ChecklistServiceImplTest {

    @Mock
    private ChecklistRepository checklistRepository;
    @Mock
    private ChecklistMapper checklistMapper;

    @InjectMocks
    private ChecklistServiceImpl checklistService;

    private Checklist testChecklist;
    private ChecklistRequest checklistRequest;
    private ChecklistResponse checklistResponse;

    @BeforeEach
    void setUp() {
        testChecklist = Checklist.builder()
                .checklistId(1L)
                .title("Tasks")
                .cardId(10L)
                .build();

        checklistRequest = new ChecklistRequest();
        checklistRequest.setTitle("Tasks");
        checklistRequest.setCardId(10L);

        checklistResponse = ChecklistResponse.builder()
                .checklistId(1L)
                .title("Tasks")
                .build();
    }

    @Test
    void createChecklist_Success() {
        when(checklistMapper.toEntity(any())).thenReturn(testChecklist);
        when(checklistRepository.save(any())).thenReturn(testChecklist);
        when(checklistMapper.toResponse(any())).thenReturn(checklistResponse);

        ChecklistResponse created = checklistService.createChecklist(checklistRequest);

        assertNotNull(created);
        assertEquals("Tasks", created.getTitle());
    }
}
