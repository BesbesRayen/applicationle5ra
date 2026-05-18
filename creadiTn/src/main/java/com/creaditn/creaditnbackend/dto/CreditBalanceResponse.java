package com.creaditn.creaditnbackend.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CreditBalanceResponse {
    private BigDecimal totalLimit;
    private BigDecimal usedCredit;
    private BigDecimal availableCredit;
    private BigDecimal outstandingPrincipal;
    private BigDecimal outstandingPayable;
}
