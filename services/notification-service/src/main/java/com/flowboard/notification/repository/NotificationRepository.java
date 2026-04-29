package com.flowboard.notification.repository;

import com.flowboard.notification.entity.Notification;
import com.flowboard.notification.entity.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientId(Long recipientId);
    List<Notification> findByRecipientIdAndIsRead(Long recipientId, boolean isRead);
    int countByRecipientIdAndIsRead(Long recipientId, boolean isRead);
    List<Notification> findByType(NotificationType type);
    List<Notification> findByRelatedId(Long relatedId);
    void deleteByNotificationId(Long notificationId);
    void deleteByRecipientIdAndIsRead(Long recipientId, boolean isRead);
}
