package com.flowboard.board.repository;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import com.flowboard.board.model.Board;

@DataJpaTest
@org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase(replace = org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class BoardRepositoryTest {

    @Autowired
    private BoardRepository boardRepository;

    @Test
    void findByWorkspaceId_ReturnsBoards() {
        Board board = Board.builder()
                .workspaceId(1L)
                .name("Workspace Board")
                .visibility("PUBLIC")
                .createdById(1L)
                .build();
        boardRepository.save(board);

        List<Board> boards = boardRepository.findByWorkspaceId(1L);

        assertFalse(boards.isEmpty());
        assertEquals("Workspace Board", boards.get(0).getName());
    }

    @Test
    void existsById_ReturnsTrue() {
        Board board = Board.builder()
                .workspaceId(1L)
                .name("Exists Board")
                .visibility("PUBLIC")
                .createdById(1L)
                .build();
        Board saved = boardRepository.save(board);

        boolean exists = boardRepository.existsById(saved.getBoardId());

        assertTrue(exists);
    }
}

