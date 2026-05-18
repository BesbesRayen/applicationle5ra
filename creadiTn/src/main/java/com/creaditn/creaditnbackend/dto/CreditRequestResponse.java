package com.creaditn.creaditnbackend.dto;

import com.creaditn.creaditnbackend.entity.CreditRequestStatus;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CreditRequestResponse {
    private Long id;
    private Long userId;
    private BigDecimal totalAmount;
    private BigDecimal downPayment;
    private BigDecimal financedAmount;
    private BigDecimal remainingPrincipal;
    private BigDecimal interestRate;
    private BigDecimal interestAmount;
    private BigDecimal totalPayable;
    private Integer numberOfInstallments;
    private BigDecimal monthlyAmount;
    private String productName;
    private CreditRequestStatus status;
    private LocalDateTime createdAt;
}
