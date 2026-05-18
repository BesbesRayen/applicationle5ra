package com.creaditn.creaditnbackend.dto;

import com.creaditn.creaditnbackend.entity.InvoiceStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceResponse {

    private Long id;
    private String invoiceNumber;
    private String transactionId;
    private Long orderId;

    private String clientName;
    private String clientEmail;
    private String clientPhone;

    private String articleName;
    private String boutiqueName;
    private BigDecimal totalPrice;
    private BigDecimal financedAmount;
    private BigDecimal interestRate;
    private BigDecimal totalPayable;
    private BigDecimal merchantMarginRate;
    private BigDecimal merchantPayoutAmount;
    private BigDecimal platformProfitAmount;
    private String paymentType;
    private Integer numberOfInstallments;
    private LocalDateTime purchaseDate;

    private InvoiceStatus status;
    private String statement;
    private LocalDateTime createdAt;
}
