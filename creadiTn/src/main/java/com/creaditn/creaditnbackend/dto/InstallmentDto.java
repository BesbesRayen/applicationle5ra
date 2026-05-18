package com.creaditn.creaditnbackend.dto;

import com.creaditn.creaditnbackend.entity.InstallmentStatus;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class InstallmentDto {
    private Long id;
    private Long creditRequestId;
    private Long userId;
    private String productName;
    private BigDecimal totalAmount;
    private LocalDate dueDate;
    private BigDecimal amount;
    private BigDecimal remainingAmount;
    private InstallmentStatus status;
    private LocalDateTime paidDate;
    private BigDecimal penalty;
}
