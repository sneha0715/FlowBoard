package com.flowboard.column.service;

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

import com.flowboard.column.dto.request.ListRequest;
import com.flowboard.column.dto.response.ListResponse;
import com.flowboard.column.exception.ResourceNotFoundException;
import com.flowboard.column.mapper.ListMapper;
import com.flowboard.column.model.TaskList;
import com.flowboard.column.repository.ListRepository;

@ExtendWith(MockitoExtension.class)
class ListServiceImplTest {

    @Mock
    private ListRepository listRepository;
    @Mock
    private ListMapper listMapper;

    @InjectMocks
    private ListServiceImpl listService;

    private TaskList testList;
    private ListRequest listRequest;
    private ListResponse listResponse;

    @BeforeEach
    void setUp() {
        testList = TaskList.builder()
                .listId(1L)
                .name("Todo")
                .boardId(10L)
                .build();

        listRequest = new ListRequest();
        listRequest.setName("Todo");
        listRequest.setBoardId(10L);

        listResponse = new ListResponse();
        listResponse.setListId(1L);
        listResponse.setName("Todo");
    }

    @Test
    void createList_Success() {
        when(listMapper.toEntity(any())).thenReturn(testList);
        when(listRepository.save(any())).thenReturn(testList);
        when(listMapper.toResponse(any())).thenReturn(listResponse);

        ListResponse created = listService.createList(listRequest);

        assertNotNull(created);
        assertEquals("Todo", created.getName());
    }

    @Test
    void getListById_Success() {
        when(listRepository.findById(1L)).thenReturn(Optional.of(testList));
        when(listMapper.toResponse(testList)).thenReturn(listResponse);

        ListResponse found = listService.getListById(1L);

        assertNotNull(found);
        assertEquals(1L, found.getListId());
    }
}
