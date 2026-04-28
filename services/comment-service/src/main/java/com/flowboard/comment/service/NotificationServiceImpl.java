package com.flowboard.comment.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    @Override
    public void notifyNewComment(Long cardId, Long commentId, Long authorId) {
        log.info("Triggering Notification-Service for NEW_COMMENT: CardID={}, CommentID={}, AuthorID={}", 
                cardId, commentId, authorId);
        // In a real scenario, this would call the external Notification-Service via Feign or RestTemplate
    }

    @Override
    public void notifyNewAttachment(Long cardId, Long attachmentId, Long uploaderId) {
        log.info("Triggering Notification-Service for NEW_ATTACHMENT: CardID={}, AttachmentID={}, UploaderID={}", 
                cardId, attachmentId, uploaderId);
        // In a real scenario, this would call the external Notification-Service
    }
}
