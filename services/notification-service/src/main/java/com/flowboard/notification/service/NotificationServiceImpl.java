package com.flowboard.notification.service;

import com.flowboard.notification.dto.response.NotificationResponse;
import com.flowboard.notification.entity.Notification;
import com.flowboard.notification.entity.NotificationType;
import com.flowboard.notification.mapper.NotificationMapper;
import com.flowboard.notification.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;
    private final JavaMailSender emailSender;

    public NotificationServiceImpl(NotificationRepository notificationRepository,
                                 NotificationMapper notificationMapper,
                                 JavaMailSender emailSender) {
        this.notificationRepository = notificationRepository;
        this.notificationMapper = notificationMapper;
        this.emailSender = emailSender;
    }

    @Override
    public void send(Notification notification) {
        notificationRepository.save(notification);
        log.info("Notification sent to recipient: {}", notification.getRecipientId());
    }

    @Override
    public void sendBulk(List<Long> recipientIds, String title, String message) {
        List<Notification> notifications = recipientIds.stream()
                .map(id -> Notification.builder()
                        .recipientId(id)
                        .actorId(0L) // System actor
                        .type(NotificationType.MOVE) // Default type for bulk
                        .title(title)
                        .message(message)
                        .build())
                .collect(Collectors.toList());
        notificationRepository.saveAll(notifications);
        log.info("Bulk notifications sent to {} recipients", recipientIds.size());
    }

    @Override
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
            log.info("Notification marked read: id={}", notificationId);
        });
    }

    @Override
    public void markAllRead(Long recipientId) {
        List<Notification> unread = notificationRepository.findByRecipientIdAndIsRead(recipientId, false);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
        log.info("All notifications marked read: recipientId={}, count={}", recipientId, unread.size());
    }

    @Override
    public void deleteRead(Long recipientId) {
        notificationRepository.deleteByRecipientIdAndIsRead(recipientId, true);
        log.info("Read notifications deleted: recipientId={}", recipientId);
    }

    @Override
    public List<NotificationResponse> getByRecipient(Long recipientId) {
        return notificationRepository.findByRecipientId(recipientId).stream()
                .map(notificationMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public int getUnreadCount(Long recipientId) {
        return notificationRepository.countByRecipientIdAndIsRead(recipientId, false);
    }

    @Override
    public void deleteNotification(Long notificationId) {
        notificationRepository.deleteById(notificationId);
        log.info("Notification deleted: id={}", notificationId);
    }

    @Override
    public void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("no-reply@flowboard.com");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            emailSender.send(message);
            log.info("Email sent to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    @Override
    public List<NotificationResponse> getAll() {
        return notificationRepository.findAll().stream()
                .map(notificationMapper::toDto)
                .collect(Collectors.toList());
    }
}
