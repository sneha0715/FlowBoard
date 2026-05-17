package com.flowboard.board.service;

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

import com.flowboard.board.dto.request.BoardRequest;
import com.flowboard.board.dto.response.BoardResponse;
import com.flowboard.board.exception.ResourceNotFoundException;
import com.flowboard.board.mapper.BoardMapper;
import com.flowboard.board.mapper.BoardMemberMapper;
import com.flowboard.board.model.Board;
import com.flowboard.board.repository.BoardMemberRepository;
import com.flowboard.board.repository.BoardRepository;

@ExtendWith(MockitoExtension.class)
class BoardServiceImplTest {

    @Mock
    private BoardRepository boardRepository;

    @Mock
    private BoardMemberRepository boardMemberRepository;

    @Mock
    private BoardMapper boardMapper;

    @Mock
    private BoardMemberMapper boardMemberMapper;

    @InjectMocks
    private BoardServiceImpl boardService;

    private Board testBoard;
    private BoardRequest boardRequest;
    private BoardResponse boardResponse;

    @BeforeEach
    void setUp() {
        testBoard = Board.builder()
                .boardId(1L)
                .name("Test Board")
                .workspaceId(1L)
                .build();

        boardRequest = new BoardRequest();
        boardRequest.setName("Test Board");
        boardRequest.setWorkspaceId(1L);

        boardResponse = new BoardResponse();
        boardResponse.setBoardId(1L);
        boardResponse.setName("Test Board");
    }

    @Test
    void createBoard_Success() {
        when(boardMapper.toEntity(any())).thenReturn(testBoard);
        when(boardRepository.save(any())).thenReturn(testBoard);
        when(boardMapper.toResponse(any())).thenReturn(boardResponse);

        BoardResponse created = boardService.createBoard(boardRequest, 1L);

        assertNotNull(created);
        assertEquals(1L, created.getBoardId());
        verify(boardRepository).save(any());
        verify(boardMemberRepository).save(any());
    }

    @Test
    void getBoardById_Success() {
        when(boardRepository.findById(1L)).thenReturn(Optional.of(testBoard));
        when(boardMapper.toResponse(testBoard)).thenReturn(boardResponse);

        BoardResponse found = boardService.getBoardById(1L);

        assertNotNull(found);
        assertEquals(1L, found.getBoardId());
    }

    @Test
    void getBoardById_NotFound_ThrowsException() {
        when(boardRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            boardService.getBoardById(1L);
        });
    }

    @Test
    void deleteBoard_Success() {
        when(boardRepository.existsById(1L)).thenReturn(true);

        boardService.deleteBoard(1L);

        verify(boardRepository).deleteById(1L);
    }

    @Test
    void deleteBoard_NotFound_ThrowsException() {
        when(boardRepository.existsById(1L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> {
            boardService.deleteBoard(1L);
        });
    }

    @Test
    void closeBoard_Success() {
        when(boardRepository.findById(1L)).thenReturn(Optional.of(testBoard));

        boardService.closeBoard(1L);

        assertTrue(testBoard.isClosed());
        verify(boardRepository).save(testBoard);
    }
}
