package com.flowboard.notification.mapper;

import com.flowboard.notification.dto.request.NotificationRequest;
import com.flowboard.notification.dto.response.NotificationResponse;
import com.flowboard.notification.entity.Notification;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public Notification toEntity(NotificationRequest request) {
        if (request == null) return null;
        Notification notification = new Notification();
        notification.setRecipientId(request.getRecipientId());
        notification.setActorId(request.getActorId());
        notification.setType(request.getType());
        notification.setMessage(request.getMessage());
        notification.setTitle(request.getTitle());
        notification.setRelatedId(request.getRelatedId());
        notification.setRelatedType(request.getRelatedType());
        return notification;
    }

    public NotificationResponse toDto(Notification entity) {
        if (entity == null) return null;
        NotificationResponse response = new NotificationResponse();
        response.setNotificationId(entity.getNotificationId());
        response.setRecipientId(entity.getRecipientId());
        response.setActorId(entity.getActorId());
        response.setType(entity.getType());
        response.setMessage(entity.getMessage());
        response.setTitle(entity.getTitle());
        response.setRelatedId(entity.getRelatedId());
        response.setRelatedType(entity.getRelatedType());
        response.setRead(entity.isRead());
        response.setCreatedAt(entity.getCreatedAt());
        return response;
    }
}
