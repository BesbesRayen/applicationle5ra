package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.*;
import com.creaditn.creaditnbackend.entity.*;
import com.creaditn.creaditnbackend.exception.BadRequestException;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.*;
import com.creaditn.creaditnbackend.util.CreditCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PurchaseService {

    private static final Set<Integer> ALLOWED_MONTHS = Set.of(3, 6, 9, 12);

    private final UserRepository userRepository;
    private final ArticleService articleService;
    private final CreditService creditService;
    private final CreditRequestRepository creditRequestRepository;
    private final InstallmentRepository installmentRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceService invoiceService;
    private final AdminNotificationService adminNotificationService;
    private final NotificationService notificationService;
    private final TransactionService transactionService;

    @Value("${app.credit.max-per-user:2000}")
    private BigDecimal maxCreditPerUser;

    @Value("${app.merchant.margin-rate:0.05}")
    private BigDecimal merchantMarginRate;

    @Transactional
    public PurchaseOrderResponse checkout(Long userId, PurchaseArticleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Article article = resolveCheckoutArticle(request);

        if (request.getPaymentType() == PurchasePaymentType.CASH) {
            return processCashPurchase(user, article);
        }

        return processCreditPurchase(user, article, request.getInstallmentMonths());
    }

    private Article resolveCheckoutArticle(PurchaseArticleRequest request) {
        return articleService.getActiveArticleEntity(request.getArticleId());
    }

    public List<PurchaseOrderResponse> getUserOrders(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return purchaseOrderRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapOrder)
                .toList();
    }

    public List<PurchaseOrderResponse> getCreditOrdersForAdmin() {
        return purchaseOrderRepository.findByPaymentTypeOrderByCreatedAtDesc(PurchasePaymentType.CREDIT)
                .stream()
                .map(this::mapOrder)
                .toList();
    }

    public long countCreditOrders() {
        return purchaseOrderRepository.countByPaymentType(PurchasePaymentType.CREDIT);
    }

    public long countTotalOrders() {
        return purchaseOrderRepository.count();
    }

    @Transactional
    protected PurchaseOrderResponse processCashPurchase(User user, Article article) {
        String transactionId = generateOrderTransactionId();

        PurchaseOrder order = PurchaseOrder.builder()
                .transactionId(transactionId)
                .user(user)
                .article(article)
                .articleName(article.getProductName())
                .boutiqueName(article.getBoutiqueName())
                .category(article.getCategory())
                .totalPrice(article.getPrice())
                .downPayment(article.getPrice())
                .financedAmount(BigDecimal.ZERO)
                .interestRate(BigDecimal.ZERO)
                .interestAmount(BigDecimal.ZERO)
                .totalPayable(article.getPrice())
                .monthlyAmount(null)
                .installmentMonths(0)
                .paymentType(PurchasePaymentType.CASH)
                .status(PurchaseOrderStatus.COMPLETED)
                .merchantPaid(true)
                .merchantMarginRate(normalizedMerchantMarginRate())
                .merchantPayoutAmount(calculateMerchantPayout(article.getPrice()))
                .platformProfitAmount(calculatePlatformProfit(article.getPrice(), BigDecimal.ZERO))
                .merchantPayoutReference(generateMerchantPayoutReference())
                .merchantPaidAt(LocalDateTime.now())
                .build();

        purchaseOrderRepository.save(order);

        transactionService.record(
                user.getId(),
                article.getPrice(),
                "PURCHASE",
                "SUCCESS",
                "Cash purchase for article " + article.getProductName(),
                transactionId
        );

        notificationService.sendNotification(
                user.getId(),
                "Purchase confirmed",
                "Cash purchase confirmed for " + article.getProductName() + ". Ref: " + transactionId,
                NotificationType.PAYMENT_CONFIRMED
        );

        return mapOrder(order);
    }

    @Transactional
    protected PurchaseOrderResponse processCreditPurchase(User user, Article article, Integer installmentMonths) {
        validateInstallmentMonths(installmentMonths);

        BigDecimal totalPrice = article.getPrice();
        BigDecimal downPayment = CreditCalculator.requiredDownPayment(totalPrice);
        CreditCalculator.CreditPlan plan = CreditCalculator.calculatePlan(totalPrice, downPayment, installmentMonths);

        if (plan.financedAmount().compareTo(maxCreditPerUser) > 0) {
            throw new BadRequestException("Financed amount exceeds max allowed per user (" + maxCreditPerUser + " TND)");
        }

        BigDecimal availableCredit = creditService.getCreditBalance(user.getId()).getAvailableCredit();
        if (plan.financedAmount().compareTo(availableCredit) > 0) {
            throw new BadRequestException("Insufficient available credit. Remaining financed balance: "
                    + availableCredit.intValue() + " TND");
        }

        CreditRequestResponse creditResponse = creditService.createCreditRequest(user.getId(),
                CreditRequestDto.builder()
                        .totalAmount(totalPrice)
                        .downPayment(downPayment)
                        .numberOfInstallments(installmentMonths)
                        .productName(article.getProductName())
                        .build());

        if (creditResponse.getStatus() != CreditRequestStatus.APPROVED) {
            throw new BadRequestException("Credit purchase was not approved");
        }

        CreditRequest creditRequest = creditRequestRepository.findById(creditResponse.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Credit request not found after approval"));

        String transactionId = generateOrderTransactionId();

        PurchaseOrder order = PurchaseOrder.builder()
                .transactionId(transactionId)
                .user(user)
                .article(article)
                .creditRequest(creditRequest)
                .articleName(article.getProductName())
                .boutiqueName(article.getBoutiqueName())
                .category(article.getCategory())
                .totalPrice(totalPrice)
                .downPayment(plan.downPayment())
                .financedAmount(plan.financedAmount())
                .interestRate(plan.interestRate())
                .interestAmount(plan.interestAmount())
                .totalPayable(plan.totalPayable())
                .monthlyAmount(creditResponse.getMonthlyAmount())
                .installmentMonths(installmentMonths)
                .paymentType(PurchasePaymentType.CREDIT)
                .status(PurchaseOrderStatus.CREDIT_ACTIVE)
                .merchantPaid(true)
                .merchantMarginRate(normalizedMerchantMarginRate())
                .merchantPayoutAmount(calculateMerchantPayout(totalPrice))
                .platformProfitAmount(calculatePlatformProfit(totalPrice, plan.interestAmount()))
                .merchantPayoutReference(generateMerchantPayoutReference())
                .merchantPaidAt(LocalDateTime.now())
                .build();

        purchaseOrderRepository.save(order);

        transactionService.record(
                user.getId(),
                plan.financedAmount(),
                "CREDIT_PURCHASE",
                "SUCCESS",
                "App paid boutique for article " + article.getProductName() + "; client reimburses monthly",
                transactionId
        );

        Invoice invoice = invoiceService.createCreditInvoice(order);
        adminNotificationService.notifyCreditPurchase(order, invoice);

        notificationService.sendNotification(
                user.getId(),
                "Credit purchase confirmed",
                "Your order for " + article.getProductName()
                        + " is active on " + installmentMonths + " installments.",
                NotificationType.CREDIT_APPROVED
        );

        return mapOrder(order);
    }

    private void validateInstallmentMonths(Integer installmentMonths) {
        if (installmentMonths == null) {
            throw new BadRequestException("Installment duration is required for credit purchases");
        }
        if (!ALLOWED_MONTHS.contains(installmentMonths)) {
            throw new BadRequestException("Allowed installment plans are: 3, 6, 9, 12 months");
        }
    }

    private PurchaseOrderResponse mapOrder(PurchaseOrder order) {
        Long invoiceId = invoiceRepository.findByOrderId(order.getId())
                .map(Invoice::getId)
                .orElse(null);

        List<InstallmentPlanItemDto> schedule = order.getCreditRequest() == null
                ? List.of()
                : installmentRepository.findByCreditRequestId(order.getCreditRequest().getId())
                .stream()
                .map(inst -> InstallmentPlanItemDto.builder()
                        .installmentId(inst.getId())
                        .dueDate(inst.getDueDate())
                        .amount(inst.getAmount().add(inst.getPenalty() == null ? BigDecimal.ZERO : inst.getPenalty()))
                        .status(inst.getStatus())
                        .build())
                .toList();

        return PurchaseOrderResponse.builder()
                .id(order.getId())
                .transactionId(order.getTransactionId())
                .userId(order.getUser().getId())
                .articleId(order.getArticle().getId())
                .articleName(order.getArticleName())
                .boutiqueName(order.getBoutiqueName())
                .category(order.getCategory())
                .totalPrice(order.getTotalPrice())
                .downPayment(order.getDownPayment())
                .financedAmount(order.getFinancedAmount())
                .interestRate(order.getInterestRate())
                .interestAmount(order.getInterestAmount())
                .totalPayable(order.getTotalPayable())
                .monthlyAmount(order.getMonthlyAmount())
                .installmentMonths(order.getInstallmentMonths())
                .paymentType(order.getPaymentType())
                .status(order.getStatus())
                .merchantPaid(order.getMerchantPaid())
                .merchantMarginRate(order.getMerchantMarginRate())
                .merchantPayoutAmount(order.getMerchantPayoutAmount())
                .platformProfitAmount(order.getPlatformProfitAmount())
                .merchantPayoutReference(order.getMerchantPayoutReference())
                .merchantPaidAt(order.getMerchantPaidAt())
                .creditRequestId(order.getCreditRequest() == null ? null : order.getCreditRequest().getId())
                .invoiceId(invoiceId)
                .createdAt(order.getCreatedAt())
                .schedule(schedule)
                .build();
    }

    private String generateOrderTransactionId() {
        return "ORD-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase();
    }

    private String generateMerchantPayoutReference() {
        return "MRCH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private BigDecimal normalizedMerchantMarginRate() {
        return merchantMarginRate == null ? BigDecimal.ZERO : merchantMarginRate.setScale(4, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateMerchantPayout(BigDecimal totalPrice) {
        BigDecimal marginAmount = totalPrice.multiply(normalizedMerchantMarginRate());
        return CreditCalculator.money(totalPrice.subtract(marginAmount));
    }

    private BigDecimal calculatePlatformProfit(BigDecimal totalPrice, BigDecimal interestAmount) {
        BigDecimal marginAmount = CreditCalculator.money(totalPrice.multiply(normalizedMerchantMarginRate()));
        BigDecimal interest = interestAmount == null ? BigDecimal.ZERO : interestAmount;
        return CreditCalculator.money(marginAmount.add(interest));
    }
}
