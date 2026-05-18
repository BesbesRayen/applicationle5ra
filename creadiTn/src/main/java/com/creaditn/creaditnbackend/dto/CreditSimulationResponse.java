package com.creaditn.creaditnbackend.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CreditSimulationResponse {
    private BigDecimal totalAmount;
    private BigDecimal downPayment;
    private BigDecimal financedAmount;
    private BigDecimal remainingPrincipal;
    private BigDecimal remainingAmount;
    private BigDecimal interestRate;
    private BigDecimal interestAmount;
    private BigDecimal totalPayable;
    private Integer numberOfInstallments;
    private BigDecimal monthlyAmount;
}
