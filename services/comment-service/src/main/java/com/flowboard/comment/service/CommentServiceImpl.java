package com.flowboard.comment.service;

import com.flowboard.comment.dto.request.AttachmentRequest;
import com.flowboard.comment.dto.request.CommentRequest;
import com.flowboard.comment.dto.response.AttachmentResponse;
import com.flowboard.comment.dto.response.CommentResponse;
import com.flowboard.comment.entity.Attachment;
import com.flowboard.comment.entity.Comment;
import com.flowboard.comment.mapper.AttachmentMapper;
import com.flowboard.comment.mapper.CommentMapper;
import com.flowboard.comment.repository.AttachmentRepository;
import com.flowboard.comment.repository.CommentRepository;
import com.flowboard.comment.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final AttachmentRepository attachmentRepository;
    private final CommentMapper commentMapper;
    private final AttachmentMapper attachmentMapper;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public CommentResponse addComment(CommentRequest request) {
        Comment comment = commentMapper.toEntity(request);
        comment.setAuthorId(getCurrentUserId());
        
        Comment savedComment = commentRepository.save(comment);
        
        notificationService.notifyNewComment(savedComment.getCardId(), savedComment.getCommentId(), savedComment.getAuthorId());
        
        return commentMapper.toResponse(savedComment);
    }

    @Override
    public List<CommentResponse> getByCard(Long cardId) {
        return commentRepository.findByCardId(cardId).stream()
                .map(commentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public CommentResponse getCommentById(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with ID: " + commentId));
        return commentMapper.toResponse(comment);
    }

    @Override
    public List<CommentResponse> getReplies(Long parentCommentId) {
        return commentRepository.findByParentCommentId(parentCommentId).stream()
                .map(commentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CommentResponse updateComment(Long commentId, String content) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with ID: " + commentId));
        
        if (!comment.getAuthorId().equals(getCurrentUserId())) {
            throw new RuntimeException("Unauthorized to update this comment");
        }
        
        comment.setContent(content);
        return commentMapper.toResponse(commentRepository.save(comment));
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with ID: " + commentId));
        
        if (!comment.getAuthorId().equals(getCurrentUserId())) {
            throw new RuntimeException("Unauthorized to delete this comment");
        }
        
        commentRepository.delete(comment); // Triggers soft delete
    }

    @Override
    @Transactional
    public AttachmentResponse addAttachment(AttachmentRequest request) {
        Attachment attachment = attachmentMapper.toEntity(request);
        attachment.setUploaderId(getCurrentUserId());
        
        Attachment savedAttachment = attachmentRepository.save(attachment);
        
        notificationService.notifyNewAttachment(savedAttachment.getCardId(), savedAttachment.getAttachmentId(), savedAttachment.getUploaderId());
        
        return attachmentMapper.toResponse(savedAttachment);
    }

    @Override
    public List<AttachmentResponse> getAttachmentsByCard(Long cardId) {
        return attachmentRepository.findByCardId(cardId).stream()
                .map(attachmentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteAttachment(Long attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found with ID: " + attachmentId));
        
        if (!attachment.getUploaderId().equals(getCurrentUserId())) {
            throw new RuntimeException("Unauthorized to delete this attachment");
        }
        
        attachmentRepository.delete(attachment);
    }

    @Override
    public long getCommentCount(Long cardId) {
        return commentRepository.countByCardId(cardId);
    }

    private Long getCurrentUserId() {
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            return Long.parseLong(principal);
        } catch (NumberFormatException e) {
            log.error("Failed to parse user ID from principal: {}", principal);
            return 0L;
        }
    }
}
