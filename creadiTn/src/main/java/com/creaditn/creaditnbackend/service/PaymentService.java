package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.PaymentDto;
import com.creaditn.creaditnbackend.dto.PayAllResponse;
import com.creaditn.creaditnbackend.dto.PaymentRequest;
import com.creaditn.creaditnbackend.entity.*;
import com.creaditn.creaditnbackend.exception.BadRequestException;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.PaymentRepository;
import com.creaditn.creaditnbackend.repository.UserRepository;
import com.creaditn.creaditnbackend.repository.UserWalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final InstallmentService installmentService;
    private final NotificationService notificationService;
    private final CardService cardService;
    private final PaymentBehaviorService paymentBehaviorService;
    private final UserWalletRepository userWalletRepository;
    private final TransactionService transactionService;

    @Transactional
    public PaymentDto makePayment(Long userId, PaymentRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Installment installment = installmentService.getInstallmentEntity(request.getInstallmentId());

        if (installment.getStatus() == InstallmentStatus.PAID) {
            throw new BadRequestException("Installment already paid");
        }

        if (!installment.getCreditRequest().getUser().getId().equals(userId)) {
            throw new BadRequestException("This installment does not belong to you");
        }

        cardService.getDefaultActiveCard(userId);

        BigDecimal penalty = installment.getPenalty() != null ? installment.getPenalty() : BigDecimal.ZERO;
        BigDecimal expectedAmount = installment.getAmount().add(penalty);
        // If no amount supplied (mobile quick-pay), use the actual installment amount
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) == 0) {
            request.setAmount(expectedAmount);
        }
        if (request.getAmount().compareTo(expectedAmount) < 0) {
            throw new BadRequestException("Payment amount must cover installment and penalty");
        }

        // Wallet balance check — replaces random simulation
        UserWallet wallet = userWalletRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("No wallet found. Please add a payment card first."));

        if (wallet.getBalance().compareTo(request.getAmount()) < 0) {
            notificationService.sendNotification(
                    userId,
                    "Payment declined",
                    "Insufficient wallet balance. Available: " + wallet.getBalance() + " TND",
                    NotificationType.PAYMENT_REMINDER
            );
            throw new BadRequestException(
                    "Payment declined: insufficient balance (" + wallet.getBalance() + " TND available)");
        }

        String txRef = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Payment payment = Payment.builder()
                .user(user)
                .installment(installment)
                .amount(request.getAmount())
                .transactionReference(txRef)
                .paymentMethod(request.getPaymentMethod())
                .build();

        boolean wasOverdue = installment.getStatus() == InstallmentStatus.OVERDUE;
        paymentRepository.save(payment);
        installmentService.markAsPaid(installment.getId());

        // Deduct from wallet
        wallet.setBalance(wallet.getBalance().subtract(request.getAmount()));
        userWalletRepository.save(wallet);

        // Record transaction
        transactionService.record(userId, request.getAmount(), "PAYMENT", "SUCCESS",
                "Installment payment", txRef);

        paymentBehaviorService.recordInstallmentPayment(userId, installment, wasOverdue);

        notificationService.sendNotification(userId,
                "Payment Confirmed",
                "Payment of " + request.getAmount() + " DT confirmed. Ref: " + txRef,
                NotificationType.PAYMENT_CONFIRMED);

        return mapToDto(payment);
    }

    public List<PaymentDto> getUserPayments(Long userId) {
        return paymentRepository.findByUserId(userId)
                .stream().map(this::mapToDto).toList();
    }

        @Transactional
        public PayAllResponse payAllInstallments(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Installment> unpaidInstallments = installmentService.getUserUnpaidInstallments(userId);
        if (unpaidInstallments.isEmpty()) {
            return PayAllResponse.builder()
                .paidInstallments(0)
                .totalPaidAmount(BigDecimal.ZERO)
                .debtBefore(BigDecimal.ZERO)
                .debtAfter(BigDecimal.ZERO)
                .build();
        }

        BigDecimal debtBefore = unpaidInstallments.stream()
            .map(i -> i.getAmount().add(i.getPenalty() != null ? i.getPenalty() : BigDecimal.ZERO))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Wallet balance check for pay-all
        UserWallet wallet = userWalletRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("No wallet found. Please add a payment card first."));

        if (wallet.getBalance().compareTo(debtBefore) < 0) {
            throw new BadRequestException(
                    "Insufficient balance for full payment. Available: " + wallet.getBalance()
                            + " TND, required: " + debtBefore + " TND");
        }

        List<Payment> payments = unpaidInstallments.stream()
            .map(installment -> Payment.builder()
                .user(user)
                .installment(installment)
                .amount(installment.getAmount().add(installment.getPenalty() != null ? installment.getPenalty() : BigDecimal.ZERO))
                .transactionReference("TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .paymentMethod("CARD")
                .build())
            .toList();

        java.util.Set<Long> overdueInstallmentIds = unpaidInstallments.stream()
                .filter(installment -> installment.getStatus() == InstallmentStatus.OVERDUE)
                .map(Installment::getId)
                .collect(java.util.stream.Collectors.toSet());

        paymentRepository.saveAll(payments);
        int paidCount = installmentService.markAllAsPaid(unpaidInstallments);

        // Deduct total from wallet
        wallet.setBalance(wallet.getBalance().subtract(debtBefore));
        userWalletRepository.save(wallet);

        // Record bulk transaction
        String bulkRef = "TXN-ALL-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        transactionService.record(userId, debtBefore, "PAYMENT", "SUCCESS",
                "Bulk installment payment ("+paidCount+" installments)", bulkRef);

        unpaidInstallments.forEach(installment ->
                paymentBehaviorService.recordInstallmentPayment(
                        userId,
                        installment,
                        overdueInstallmentIds.contains(installment.getId())
                ));

        notificationService.sendNotification(
            userId,
            "All Installments Paid",
            "All your due installments have been paid successfully.",
            NotificationType.PAYMENT_CONFIRMED
        );

        return PayAllResponse.builder()
            .paidInstallments(paidCount)
            .totalPaidAmount(debtBefore)
            .debtBefore(debtBefore)
            .debtAfter(BigDecimal.ZERO)
            .build();
        }

    public PaymentDto getPaymentByReference(String reference) {
        Payment payment = paymentRepository.findByTransactionReference(reference)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
        return mapToDto(payment);
    }

    private PaymentDto mapToDto(Payment p) {
        return PaymentDto.builder()
                .id(p.getId())
                .userId(p.getUser().getId())
                .installmentId(p.getInstallment().getId())
                .amount(p.getAmount())
                .transactionReference(p.getTransactionReference())
                .paymentMethod(p.getPaymentMethod())
                .paidAt(p.getPaidAt())
                .build();
    }

}
