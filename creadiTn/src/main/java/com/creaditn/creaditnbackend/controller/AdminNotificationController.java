package com.creaditn.creaditnbackend.controller;

import com.creaditn.creaditnbackend.dto.AdminNotificationDto;
import com.creaditn.creaditnbackend.dto.ApiResponse;
import com.creaditn.creaditnbackend.service.AdminNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
public class AdminNotificationController {

    private final AdminNotificationService adminNotificationService;

    @GetMapping
    public ResponseEntity<List<AdminNotificationDto>> getAll() {
        return ResponseEntity.ok(adminNotificationService.getAll());
    }

    @GetMapping("/unread")
    public ResponseEntity<List<AdminNotificationDto>> getUnread() {
        return ResponseEntity.ok(adminNotificationService.getUnread());
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        return ResponseEntity.ok(Map.of("count", adminNotificationService.getUnreadCount()));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse> markAsRead(@PathVariable Long id) {
        adminNotificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Admin notification marked as read"));
    }
}
