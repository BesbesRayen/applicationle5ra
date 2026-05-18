package com.creaditn.creaditnbackend.dto;

import com.creaditn.creaditnbackend.entity.PurchaseOrderStatus;
import com.creaditn.creaditnbackend.entity.PurchasePaymentType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrderResponse {

    private Long id;
    private String transactionId;
    private Long userId;
    private Long articleId;
    private String articleName;
    private String boutiqueName;
    private String category;
    private BigDecimal totalPrice;
    private BigDecimal downPayment;
    private BigDecimal financedAmount;
    private BigDecimal interestRate;
    private BigDecimal interestAmount;
    private BigDecimal totalPayable;
    private BigDecimal monthlyAmount;
    private Integer installmentMonths;
    private PurchasePaymentType paymentType;
    private PurchaseOrderStatus status;
    private Boolean merchantPaid;
    private BigDecimal merchantMarginRate;
    private BigDecimal merchantPayoutAmount;
    private BigDecimal platformProfitAmount;
    private String merchantPayoutReference;
    private LocalDateTime merchantPaidAt;
    private Long creditRequestId;
    private Long invoiceId;
    private LocalDateTime createdAt;
    private List<InstallmentPlanItemDto> schedule;
}
