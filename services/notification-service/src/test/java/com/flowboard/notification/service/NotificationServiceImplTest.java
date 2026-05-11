package com.flowboard.notification.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.flowboard.notification.dto.response.NotificationResponse;
import com.flowboard.notification.entity.Notification;
import com.flowboard.notification.mapper.NotificationMapper;
import com.flowboard.notification.repository.NotificationRepository;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private NotificationMapper notificationMapper;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private Notification testNotification;
    private NotificationResponse notificationResponse;

    @BeforeEach
    void setUp() {
        testNotification = new Notification();
        testNotification.setNotificationId(1L);
        testNotification.setMessage("Test Notification");
        testNotification.setRecipientId(10L);

        notificationResponse = NotificationResponse.builder()
                .notificationId(1L)
                .message("Test Notification")
                .build();
    }

    @Test
    void getByRecipient_Success() {
        when(notificationRepository.findByRecipientId(10L)).thenReturn(List.of(testNotification));
        when(notificationMapper.toDto(testNotification)).thenReturn(notificationResponse);

        List<NotificationResponse> found = notificationService.getByRecipient(10L);

        assertNotNull(found);
        assertFalse(found.isEmpty());
        assertEquals(1L, found.get(0).getNotificationId());
    }

    @Test
    void markAsRead_Success() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(testNotification));
        
        notificationService.markAsRead(1L);

        assertTrue(testNotification.isRead());
        verify(notificationRepository).save(testNotification);
    }
}
