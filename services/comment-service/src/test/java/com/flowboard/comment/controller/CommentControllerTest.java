package com.flowboard.comment.controller;

import static org.mockito.ArgumentMatchers.any;
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
import com.flowboard.comment.dto.request.CommentRequest;
import com.flowboard.comment.dto.response.CommentResponse;
import com.flowboard.comment.service.CommentService;

@WebMvcTest(controllers = CommentResource.class, excludeAutoConfiguration = {
    org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class,
    org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration.class
})
@AutoConfigureMockMvc(addFilters = false)
@org.springframework.test.context.ActiveProfiles("test")
class CommentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CommentService commentService;

    @MockBean(name = "commentSecurity")
    private Object commentSecurity;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void addComment_ReturnsOk() throws Exception {
        CommentRequest request = new CommentRequest();
        request.setContent("New Comment");
        request.setCardId(10L);

        CommentResponse response = CommentResponse.builder()
                .commentId(1L)
                .content("New Comment")
                .build();

        when(commentService.addComment(any())).thenReturn(response);

        mockMvc.perform(post("/comments")
                .requestAttr("userId", 10L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").value("New Comment"));
    }

    @Test
    void getCommentById_ReturnsOk() throws Exception {
        CommentResponse response = CommentResponse.builder()
                .commentId(1L)
                .content("Test Comment")
                .build();

        when(commentService.getCommentById(1L)).thenReturn(response);

        mockMvc.perform(get("/comments/1")
                .requestAttr("userId", 10L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").value("Test Comment"));
    }
}
