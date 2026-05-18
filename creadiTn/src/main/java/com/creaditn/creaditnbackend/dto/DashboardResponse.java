package com.creaditn.creaditnbackend.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardResponse {
    private BigDecimal totalLimit;
    private BigDecimal usedCredit;
    private BigDecimal availableCredit;
    private BigDecimal outstandingPrincipal;
    private BigDecimal outstandingPayable;
    private Integer activeLoans;
    private BigDecimal nextPaymentAmount;
    private String nextPaymentDate;
    private Integer creditScore;

    private String kycStatus;
    private String cardStatus;
    private String profileStatus;
    private String nextStep;
}
