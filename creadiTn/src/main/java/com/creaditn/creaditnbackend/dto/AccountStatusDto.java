package com.creaditn.creaditnbackend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountStatusDto {
    private boolean autopay;
    private String nextInstallmentDate;
    private Double nextInstallmentAmount;
    private int paidCount;
    private int totalCount;
    private int pendingCount;
    private int overdueCount;
    /** BON_PAYEUR | RISQUE | NEUTRE */
    private String payerStatus;
}
