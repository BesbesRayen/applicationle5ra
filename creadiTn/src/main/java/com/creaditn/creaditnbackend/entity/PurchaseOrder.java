package com.creaditn.creaditnbackend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "purchase_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 70)
    private String transactionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "article_id", nullable = false)
    private Article article;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_request_id")
    private CreditRequest creditRequest;

    @Column(nullable = false, length = 160)
    private String articleName;

    @Column(nullable = false, length = 160)
    private String boutiqueName;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal downPayment;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal financedAmount;

    @Column(nullable = false, precision = 8, scale = 4)
    private BigDecimal interestRate;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal interestAmount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPayable;

    @Column(precision = 12, scale = 2)
    private BigDecimal monthlyAmount;

    private Integer installmentMonths;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PurchasePaymentType paymentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PurchaseOrderStatus status;

    @Column(nullable = false)
    private Boolean merchantPaid;

    @Column(nullable = false, precision = 8, scale = 4)
    private BigDecimal merchantMarginRate;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal merchantPayoutAmount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal platformProfitAmount;

    @Column(length = 120)
    private String merchantPayoutReference;

    private LocalDateTime merchantPaidAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (merchantPaid == null) {
            merchantPaid = false;
        }
        if (interestRate == null) interestRate = BigDecimal.ZERO;
        if (interestAmount == null) interestAmount = BigDecimal.ZERO;
        if (totalPayable == null) totalPayable = totalPrice;
        if (merchantMarginRate == null) merchantMarginRate = BigDecimal.ZERO;
        if (merchantPayoutAmount == null) merchantPayoutAmount = totalPrice;
        if (platformProfitAmount == null) platformProfitAmount = BigDecimal.ZERO;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
