package com.flowboard.notification.dto.response;

import com.flowboard.notification.entity.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
}
