package com.flowboard.board.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flowboard.board.dto.request.BoardRequest;
import com.flowboard.board.dto.response.BoardResponse;
import com.flowboard.board.service.BoardService;

@WebMvcTest(BoardResource.class)
@AutoConfigureMockMvc(addFilters = false)
class BoardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BoardService boardService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createBoard_ReturnsOk() throws Exception {
        BoardRequest request = new BoardRequest();
        request.setName("New Board");
        request.setWorkspaceId(1L);

        BoardResponse response = new BoardResponse();
        response.setBoardId(1L);
        response.setName("New Board");

        when(boardService.createBoard(any(), eq(1L))).thenReturn(response);

        mockMvc.perform(post("/boards")
                .requestAttr("userId", 1L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("New Board"));
    }

    @Test
    void getBoardById_ReturnsOk() throws Exception {
        BoardResponse response = new BoardResponse();
        response.setBoardId(1L);
        response.setName("Test Board");

        when(boardService.getBoardById(1L)).thenReturn(response);

        mockMvc.perform(get("/boards/1")
                .requestAttr("userId", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Test Board"));
    }
}
