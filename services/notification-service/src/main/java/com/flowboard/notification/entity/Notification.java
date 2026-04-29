package com.flowboard.notification.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long notificationId;

    @Column(nullable = false)
    private Long recipientId;

    @Column(nullable = false)
    private Long actorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(nullable = false, length = 1000)
    private String message;

    @Column(nullable = false)
    private String title;

    private Long relatedId;

    private String relatedType;

    @Column(nullable = false)
    private boolean isRead = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public Notification() {}

    public Notification(Long notificationId, Long recipientId, Long actorId, NotificationType type, String message, String title, Long relatedId, String relatedType, boolean isRead, LocalDateTime createdAt) {
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

    public static NotificationBuilder builder() {
        return new NotificationBuilder();
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

    public static class NotificationBuilder {
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

        public NotificationBuilder notificationId(Long notificationId) { this.notificationId = notificationId; return this; }
        public NotificationBuilder recipientId(Long recipientId) { this.recipientId = recipientId; return this; }
        public NotificationBuilder actorId(Long actorId) { this.actorId = actorId; return this; }
        public NotificationBuilder type(NotificationType type) { this.type = type; return this; }
        public NotificationBuilder message(String message) { this.message = message; return this; }
        public NotificationBuilder title(String title) { this.title = title; return this; }
        public NotificationBuilder relatedId(Long relatedId) { this.relatedId = relatedId; return this; }
        public NotificationBuilder relatedType(String relatedType) { this.relatedType = relatedType; return this; }
        public NotificationBuilder isRead(boolean isRead) { this.isRead = isRead; return this; }
        public NotificationBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Notification build() {
            return new Notification(notificationId, recipientId, actorId, type, message, title, relatedId, relatedType, isRead, createdAt);
        }
    }
}
