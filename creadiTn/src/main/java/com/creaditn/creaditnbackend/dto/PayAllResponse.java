package com.creaditn.creaditnbackend.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayAllResponse {
    private int paidInstallments;
    private BigDecimal totalPaidAmount;
    private BigDecimal debtBefore;
    private BigDecimal debtAfter;
}
