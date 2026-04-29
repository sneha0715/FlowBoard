package com.flowboard.notification.service;

import com.flowboard.notification.dto.response.NotificationResponse;
import com.flowboard.notification.entity.Notification;

import java.util.List;

public interface NotificationService {
    void send(Notification notification);
    void sendBulk(List<Long> recipientIds, String title, String message);
    void markAsRead(Long notificationId);
    void markAllRead(Long recipientId);
    void deleteRead(Long recipientId);
    List<NotificationResponse> getByRecipient(Long recipientId);
    int getUnreadCount(Long recipientId);
    void deleteNotification(Long notificationId);
    void sendEmail(String to, String subject, String body);
    List<NotificationResponse> getAll();
}
