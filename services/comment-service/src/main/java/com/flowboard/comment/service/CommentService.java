package com.flowboard.comment.service;

import com.flowboard.comment.dto.request.AttachmentRequest;
import com.flowboard.comment.dto.request.CommentRequest;
import com.flowboard.comment.dto.response.AttachmentResponse;
import com.flowboard.comment.dto.response.CommentResponse;

import java.util.List;

public interface CommentService {
    CommentResponse addComment(CommentRequest request);
    List<CommentResponse> getByCard(Long cardId);
    CommentResponse getCommentById(Long commentId);
    List<CommentResponse> getReplies(Long parentCommentId);
    CommentResponse updateComment(Long commentId, String content);
    void deleteComment(Long commentId);
    
    AttachmentResponse addAttachment(AttachmentRequest request);
    List<AttachmentResponse> getAttachmentsByCard(Long cardId);
    void deleteAttachment(Long attachmentId);
    
    long getCommentCount(Long cardId);
    Long getCardIdByCommentId(Long commentId);
}
