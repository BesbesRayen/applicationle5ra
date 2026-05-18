package com.creaditn.creaditnbackend.dto;

import com.creaditn.creaditnbackend.entity.NotificationType;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class NotificationDto {
    private Long id;
    private Long userId;
    private String title;
    private String message;
    private NotificationType type;
    private Boolean read;
    private LocalDateTime createdAt;
}
