package com.flowboard.comment.controller;

import com.flowboard.comment.dto.request.AttachmentRequest;
import com.flowboard.comment.dto.request.CommentRequest;
import com.flowboard.comment.dto.request.CommentUpdateRequest;
import com.flowboard.comment.dto.response.ApiResponse;
import com.flowboard.comment.dto.response.AttachmentResponse;
import com.flowboard.comment.dto.response.CommentResponse;
import com.flowboard.comment.service.CommentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("")
@RequiredArgsConstructor
public class CommentResource {

    private final CommentService commentService;

    // Comments Endpoints
    
    @PostMapping("/comments")
    @PreAuthorize("@commentSecurity.isBoardMemberByCardId(#request.cardId, #requesterId)")
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @Valid @RequestBody CommentRequest request,
            @RequestAttribute(value = "userId", required = false) Long requesterId,
            HttpServletRequest httpRequest) {
        CommentResponse response = commentService.addComment(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Comment added successfully", httpRequest.getRequestURI()));
    }

    @GetMapping("/comments/card/{cardId}")
    @PreAuthorize("@commentSecurity.isBoardMemberByCardId(#cardId, #requesterId)")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getCommentsByCard(
            @PathVariable Long cardId,
            @RequestAttribute(value = "userId", required = false) Long requesterId,
            HttpServletRequest httpRequest) {
        List<CommentResponse> response = commentService.getByCard(cardId);
        return ResponseEntity.ok(ApiResponse.success(response, "Comments retrieved successfully", httpRequest.getRequestURI()));
    }

    @GetMapping("/comments/{commentId}")
    @PreAuthorize("@commentSecurity.isBoardMemberByCardId(@commentService.getCardIdByCommentId(#commentId), #requesterId)")
    public ResponseEntity<ApiResponse<CommentResponse>> getCommentById(
            @PathVariable Long commentId,
            @RequestAttribute(value = "userId", required = false) Long requesterId,
            HttpServletRequest httpRequest) {
        CommentResponse response = commentService.getCommentById(commentId);
        return ResponseEntity.ok(ApiResponse.success(response, "Comment retrieved successfully", httpRequest.getRequestURI()));
    }

    @GetMapping("/comments/{commentId}/replies")
    @PreAuthorize("@commentSecurity.isBoardMemberByCardId(@commentService.getCardIdByCommentId(#commentId), #requesterId)")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getReplies(
            @PathVariable Long commentId,
            @RequestAttribute(value = "userId", required = false) Long requesterId,
            HttpServletRequest httpRequest) {
        List<CommentResponse> response = commentService.getReplies(commentId);
        return ResponseEntity.ok(ApiResponse.success(response, "Replies retrieved successfully", httpRequest.getRequestURI()));
    }

    @PutMapping("/comments/{commentId}")
    @PreAuthorize("@commentSecurity.canModifyComment(#commentId, #requesterId)")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentUpdateRequest request,
            @RequestAttribute(value = "userId", required = false) Long requesterId,
            HttpServletRequest httpRequest) {
        CommentResponse response = commentService.updateComment(commentId, request.getContent());
        return ResponseEntity.ok(ApiResponse.success(response, "Comment updated successfully", httpRequest.getRequestURI()));
    }

    @DeleteMapping("/comments/{commentId}")
    @PreAuthorize("@commentSecurity.canModifyComment(#commentId, #requesterId)")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable Long commentId,
            @RequestAttribute(value = "userId", required = false) Long requesterId,
            HttpServletRequest httpRequest) {
        commentService.deleteComment(commentId);
        return ResponseEntity.ok(ApiResponse.success(null, "Comment deleted successfully", httpRequest.getRequestURI()));
    }

    @GetMapping("/comments/card/{cardId}/count")
    @PreAuthorize("@commentSecurity.isBoardMemberByCardId(#cardId, #requesterId)")
    public ResponseEntity<ApiResponse<Long>> getCommentCount(
            @PathVariable Long cardId,
            @RequestAttribute(value = "userId", required = false) Long requesterId,
            HttpServletRequest httpRequest) {
        Long response = commentService.getCommentCount(cardId);
        return ResponseEntity.ok(ApiResponse.success(response, "Comment count retrieved successfully", httpRequest.getRequestURI()));
    }

    // Attachments Endpoints

    @PostMapping("/attachments")
    @PreAuthorize("@commentSecurity.isBoardMemberByCardId(#request.cardId, #requesterId)")
    public ResponseEntity<ApiResponse<AttachmentResponse>> addAttachment(
            @Valid @RequestBody AttachmentRequest request,
            @RequestAttribute(value = "userId", required = false) Long requesterId,
            HttpServletRequest httpRequest) {
        AttachmentResponse response = commentService.addAttachment(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Attachment added successfully", httpRequest.getRequestURI()));
    }

    @GetMapping("/attachments/card/{cardId}")
    @PreAuthorize("@commentSecurity.isBoardMemberByCardId(#cardId, #requesterId)")
    public ResponseEntity<ApiResponse<List<AttachmentResponse>>> getAttachmentsByCard(
            @PathVariable Long cardId,
            @RequestAttribute(value = "userId", required = false) Long requesterId,
            HttpServletRequest httpRequest) {
        List<AttachmentResponse> response = commentService.getAttachmentsByCard(cardId);
        return ResponseEntity.ok(ApiResponse.success(response, "Attachments retrieved successfully", httpRequest.getRequestURI()));
    }

    @DeleteMapping("/attachments/{attachmentId}")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable Long attachmentId,
            @RequestAttribute(value = "userId", required = false) Long requesterId,
            HttpServletRequest httpRequest) {
        // Need similar check for attachment
        commentService.deleteAttachment(attachmentId);
        return ResponseEntity.ok(ApiResponse.success(null, "Attachment deleted successfully", httpRequest.getRequestURI()));
    }
}
