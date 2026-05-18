package com.creaditn.creaditnbackend.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionDto {
    private Long id;
    private Long userId;
    private BigDecimal amount;
    private String type;
    private String status;
    private String description;
    private String reference;
    private LocalDateTime createdAt;
}
