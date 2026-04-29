package com.flowboard.notification.controller;

import com.flowboard.notification.dto.request.NotificationRequest;
import com.flowboard.notification.dto.response.ApiResponse;
import com.flowboard.notification.dto.response.NotificationResponse;
import com.flowboard.notification.mapper.NotificationMapper;
import com.flowboard.notification.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationResource {

    private final NotificationService notificationService;
    private final NotificationMapper notificationMapper;

    public NotificationResource(NotificationService notificationService, NotificationMapper notificationMapper) {
        this.notificationService = notificationService;
        this.notificationMapper = notificationMapper;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> sendNotification(@Valid @RequestBody NotificationRequest request) {
        notificationService.send(notificationMapper.toEntity(request));
        return ResponseEntity.ok(ApiResponse.success(null, "Notification sent successfully"));
    }

    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<Void>> sendBulk(@RequestBody List<Long> recipientIds, 
                                                    @RequestParam String title, 
                                                    @RequestParam String message) {
        notificationService.sendBulk(recipientIds, title, message);
        return ResponseEntity.ok(ApiResponse.success(null, "Bulk notifications sent successfully"));
    }

    @GetMapping("/recipient/{recipientId}")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getByRecipient(@PathVariable Long recipientId) {
        List<NotificationResponse> notifications = notificationService.getByRecipient(recipientId);
        return ResponseEntity.ok(ApiResponse.success(notifications, "Notifications retrieved successfully"));
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long notificationId) {
        notificationService.markAsRead(notificationId);
        return ResponseEntity.ok(ApiResponse.success(null, "Notification marked as read"));
    }

    @PutMapping("/recipient/{recipientId}/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead(@PathVariable Long recipientId) {
        notificationService.markAllRead(recipientId);
        return ResponseEntity.ok(ApiResponse.success(null, "All notifications marked as read"));
    }

    @DeleteMapping("/recipient/{recipientId}/read")
    public ResponseEntity<ApiResponse<Void>> deleteRead(@PathVariable Long recipientId) {
        notificationService.deleteRead(recipientId);
        return ResponseEntity.ok(ApiResponse.success(null, "Read notifications deleted successfully"));
    }

    @GetMapping("/recipient/{recipientId}/unread-count")
    public ResponseEntity<ApiResponse<Integer>> getUnreadCount(@PathVariable Long recipientId) {
        int count = notificationService.getUnreadCount(recipientId);
        return ResponseEntity.ok(ApiResponse.success(count, "Unread count retrieved successfully"));
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long notificationId) {
        notificationService.deleteNotification(notificationId);
        return ResponseEntity.ok(ApiResponse.success(null, "Notification deleted successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getAll() {
        List<NotificationResponse> notifications = notificationService.getAll();
        return ResponseEntity.ok(ApiResponse.success(notifications, "All notifications retrieved successfully"));
    }

    @PostMapping("/email")
    public ResponseEntity<ApiResponse<Void>> sendEmail(@RequestParam String to, 
                                                     @RequestParam String subject, 
                                                     @RequestParam String body) {
        notificationService.sendEmail(to, subject, body);
        return ResponseEntity.ok(ApiResponse.success(null, "Email dispatched successfully"));
    }
}
