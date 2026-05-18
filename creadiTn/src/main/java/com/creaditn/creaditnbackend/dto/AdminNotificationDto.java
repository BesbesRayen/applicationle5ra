package com.creaditn.creaditnbackend.dto;

import com.creaditn.creaditnbackend.entity.AdminNotificationType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminNotificationDto {

    private Long id;
    private String title;
    private String message;
    private AdminNotificationType type;
    private Boolean read;
    private Long orderId;
    private String transactionId;
    private LocalDateTime createdAt;
}
