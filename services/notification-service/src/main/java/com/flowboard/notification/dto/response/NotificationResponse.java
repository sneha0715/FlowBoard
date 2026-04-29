package com.flowboard.notification.dto.response;

import com.flowboard.notification.entity.NotificationType;

import java.time.LocalDateTime;

public class NotificationResponse {
    private Long notificationId;
    private Long recipientId;
    private Long actorId;
    private NotificationType type;
    private String message;
    private String title;
    private Long relatedId;
    private String relatedType;
    private boolean isRead;
    private LocalDateTime createdAt;

    public NotificationResponse() {}

    public NotificationResponse(Long notificationId, Long recipientId, Long actorId, NotificationType type, String message, String title, Long relatedId, String relatedType, boolean isRead, LocalDateTime createdAt) {
        this.notificationId = notificationId;
        this.recipientId = recipientId;
        this.actorId = actorId;
        this.type = type;
        this.message = message;
        this.title = title;
        this.relatedId = relatedId;
        this.relatedType = relatedType;
        this.isRead = isRead;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getNotificationId() { return notificationId; }
    public void setNotificationId(Long notificationId) { this.notificationId = notificationId; }
    public Long getRecipientId() { return recipientId; }
    public void setRecipientId(Long recipientId) { this.recipientId = recipientId; }
    public Long getActorId() { return actorId; }
    public void setActorId(Long actorId) { this.actorId = actorId; }
    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Long getRelatedId() { return relatedId; }
    public void setRelatedId(Long relatedId) { this.relatedId = relatedId; }
    public String getRelatedType() { return relatedType; }
    public void setRelatedType(String relatedType) { this.relatedType = relatedType; }
    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
