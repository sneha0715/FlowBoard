package com.flowboard.comment.service;

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

import com.flowboard.comment.dto.request.CommentRequest;
import com.flowboard.comment.dto.response.CommentResponse;
import com.flowboard.comment.entity.Comment;
import com.flowboard.comment.exception.ResourceNotFoundException;
import com.flowboard.comment.mapper.CommentMapper;
import com.flowboard.comment.repository.CommentRepository;

@ExtendWith(MockitoExtension.class)
class CommentServiceImplTest {

    @Mock
    private CommentRepository commentRepository;
    @Mock
    private CommentMapper commentMapper;

    @InjectMocks
    private CommentServiceImpl commentService;

    private Comment testComment;
    private CommentRequest commentRequest;
    private CommentResponse commentResponse;

    @BeforeEach
    void setUp() {
        testComment = Comment.builder()
                .commentId(1L)
                .content("Test Content")
                .cardId(10L)
                .build();

        commentRequest = new CommentRequest();
        commentRequest.setContent("Test Content");
        commentRequest.setCardId(10L);

        commentResponse = CommentResponse.builder()
                .commentId(1L)
                .content("Test Content")
                .build();
    }

    @Test
    void createComment_Success() {
        when(commentMapper.toEntity(any())).thenReturn(testComment);
        when(commentRepository.save(any())).thenReturn(testComment);
        when(commentMapper.toResponse(any())).thenReturn(commentResponse);

        CommentResponse created = commentService.addComment(commentRequest);

        assertNotNull(created);
        assertEquals("Test Content", created.getContent());
    }

    @Test
    void getCommentById_Success() {
        when(commentRepository.findById(1L)).thenReturn(Optional.of(testComment));
        when(commentMapper.toResponse(testComment)).thenReturn(commentResponse);

        CommentResponse found = commentService.getCommentById(1L);

        assertNotNull(found);
        assertEquals(1L, found.getCommentId());
    }
}
