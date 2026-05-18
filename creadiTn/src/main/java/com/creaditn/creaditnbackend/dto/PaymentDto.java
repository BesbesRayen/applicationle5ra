package com.creaditn.creaditnbackend.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PaymentDto {
    private Long id;
    private Long userId;
    private Long installmentId;
    private BigDecimal amount;
    private String transactionReference;
    private String paymentMethod;
    private LocalDateTime paidAt;
}
