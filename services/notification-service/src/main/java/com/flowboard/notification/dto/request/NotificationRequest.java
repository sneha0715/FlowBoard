package com.flowboard.notification.dto.request;

import com.flowboard.notification.entity.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class NotificationRequest {

    @NotNull(message = "Recipient ID is required")
    private Long recipientId;

    @NotNull(message = "Actor ID is required")
    private Long actorId;

    @NotNull(message = "Notification type is required")
    private NotificationType type;

    @NotBlank(message = "Message is required")
    private String message;

    @NotBlank(message = "Title is required")
    private String title;

    private Long relatedId;

    private String relatedType;

    public NotificationRequest() {}

    public NotificationRequest(Long recipientId, Long actorId, NotificationType type, String message, String title, Long relatedId, String relatedType) {
        this.recipientId = recipientId;
        this.actorId = actorId;
        this.type = type;
        this.message = message;
        this.title = title;
        this.relatedId = relatedId;
        this.relatedType = relatedType;
    }

    // Getters and Setters
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

    public static NotificationRequestBuilder builder() {
        return new NotificationRequestBuilder();
    }

    public static class NotificationRequestBuilder {
        private Long recipientId;
        private Long actorId;
        private NotificationType type;
        private String message;
        private String title;
        private Long relatedId;
        private String relatedType;

        public NotificationRequestBuilder recipientId(Long recipientId) { this.recipientId = recipientId; return this; }
        public NotificationRequestBuilder actorId(Long actorId) { this.actorId = actorId; return this; }
        public NotificationRequestBuilder type(NotificationType type) { this.type = type; return this; }
        public NotificationRequestBuilder message(String message) { this.message = message; return this; }
        public NotificationRequestBuilder title(String title) { this.title = title; return this; }
        public NotificationRequestBuilder relatedId(Long relatedId) { this.relatedId = relatedId; return this; }
        public NotificationRequestBuilder relatedType(String relatedType) { this.relatedType = relatedType; return this; }

        public NotificationRequest build() {
            return new NotificationRequest(recipientId, actorId, type, message, title, relatedId, relatedType);
        }
    }
}
