package com.flowboard.comment.controller;

import com.flowboard.comment.dto.request.CommentUpdateRequest;
import com.flowboard.comment.dto.response.ApiResponse;
import com.flowboard.comment.dto.request.AttachmentRequest;
import com.flowboard.comment.dto.request.CommentRequest;
import com.flowboard.comment.dto.response.AttachmentResponse;
import com.flowboard.comment.dto.response.CommentResponse;
import com.flowboard.comment.service.CommentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("")
@RequiredArgsConstructor
public class CommentResource {

    private final CommentService commentService;

    // Comments Endpoints
    
    @PostMapping("/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(@Valid @RequestBody CommentRequest request, HttpServletRequest httpRequest) {
        CommentResponse response = commentService.addComment(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Comment added successfully", httpRequest.getRequestURI()));
    }

    @GetMapping("/comments/card/{cardId}")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getCommentsByCard(@PathVariable Long cardId, HttpServletRequest httpRequest) {
        List<CommentResponse> response = commentService.getByCard(cardId);
        return ResponseEntity.ok(ApiResponse.success(response, "Comments retrieved successfully", httpRequest.getRequestURI()));
    }

    @GetMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<CommentResponse>> getCommentById(@PathVariable Long commentId, HttpServletRequest httpRequest) {
        CommentResponse response = commentService.getCommentById(commentId);
        return ResponseEntity.ok(ApiResponse.success(response, "Comment retrieved successfully", httpRequest.getRequestURI()));
    }

    @GetMapping("/comments/{commentId}/replies")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getReplies(@PathVariable Long commentId, HttpServletRequest httpRequest) {
        List<CommentResponse> response = commentService.getReplies(commentId);
        return ResponseEntity.ok(ApiResponse.success(response, "Replies retrieved successfully", httpRequest.getRequestURI()));
    }

    @PutMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(@PathVariable Long commentId, @Valid @RequestBody CommentUpdateRequest request, HttpServletRequest httpRequest) {
        CommentResponse response = commentService.updateComment(commentId, request.getContent());
        return ResponseEntity.ok(ApiResponse.success(response, "Comment updated successfully", httpRequest.getRequestURI()));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable Long commentId, HttpServletRequest httpRequest) {
        commentService.deleteComment(commentId);
        return ResponseEntity.ok(ApiResponse.success(null, "Comment deleted successfully", httpRequest.getRequestURI()));
    }

    @GetMapping("/comments/card/{cardId}/count")
    public ResponseEntity<ApiResponse<Long>> getCommentCount(@PathVariable Long cardId, HttpServletRequest httpRequest) {
        Long response = commentService.getCommentCount(cardId);
        return ResponseEntity.ok(ApiResponse.success(response, "Comment count retrieved successfully", httpRequest.getRequestURI()));
    }

    // Attachments Endpoints

    @PostMapping("/attachments")
    public ResponseEntity<ApiResponse<AttachmentResponse>> addAttachment(@Valid @RequestBody AttachmentRequest request, HttpServletRequest httpRequest) {
        AttachmentResponse response = commentService.addAttachment(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Attachment added successfully", httpRequest.getRequestURI()));
    }

    @GetMapping("/attachments/card/{cardId}")
    public ResponseEntity<ApiResponse<List<AttachmentResponse>>> getAttachmentsByCard(@PathVariable Long cardId, HttpServletRequest httpRequest) {
        List<AttachmentResponse> response = commentService.getAttachmentsByCard(cardId);
        return ResponseEntity.ok(ApiResponse.success(response, "Attachments retrieved successfully", httpRequest.getRequestURI()));
    }

    @DeleteMapping("/attachments/{attachmentId}")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(@PathVariable Long attachmentId, HttpServletRequest httpRequest) {
        commentService.deleteAttachment(attachmentId);
        return ResponseEntity.ok(ApiResponse.success(null, "Attachment deleted successfully", httpRequest.getRequestURI()));
    }
}
