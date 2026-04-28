package com.flowboard.comment.service;

public interface NotificationService {
    void notifyNewComment(Long cardId, Long commentId, Long authorId);
    void notifyNewAttachment(Long cardId, Long attachmentId, Long uploaderId);
}
