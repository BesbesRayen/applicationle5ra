package com.creaditn.creaditnbackend.scheduler;

import com.creaditn.creaditnbackend.entity.*;
import com.creaditn.creaditnbackend.repository.InstallmentRepository;
import com.creaditn.creaditnbackend.repository.UserRepository;
import com.creaditn.creaditnbackend.repository.UserWalletRepository;
import com.creaditn.creaditnbackend.service.NotificationService;
import com.creaditn.creaditnbackend.service.PaymentBehaviorService;
import com.creaditn.creaditnbackend.service.TransactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class AutopayScheduler {

    private final InstallmentRepository installmentRepository;
    private final UserRepository userRepository;
    private final UserWalletRepository userWalletRepository;
    private final NotificationService notificationService;
    private final TransactionService transactionService;
    private final PaymentBehaviorService paymentBehaviorService;

    /**
     * Runs every day at 08:00 AM.
     * For users with autopay=TRUE, auto-pays any installments due today or earlier.
     */
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void processAutopayments() {
        log.info("[AutopayScheduler] Running daily autopay job...");

        // Find all PENDING or OVERDUE installments due on or before today
        List<Installment> dueInstallments = new java.util.ArrayList<>(
                installmentRepository.findByStatusAndDueDateBefore(InstallmentStatus.PENDING, LocalDate.now().plusDays(1))
        );
        dueInstallments.addAll(installmentRepository.findByStatus(InstallmentStatus.OVERDUE));

        for (Installment installment : dueInstallments) {
            Long userId = installment.getCreditRequest().getUser().getId();
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) continue;

            // Skip users who have not enabled autopay
            if (Boolean.FALSE.equals(user.getAutopay())) continue;

            userWalletRepository.findByUserId(userId).ifPresent(wallet -> {
                BigDecimal penalty = installment.getPenalty() != null ? installment.getPenalty() : BigDecimal.ZERO;
                BigDecimal total = installment.getAmount().add(penalty);

                if (wallet.getBalance().compareTo(total) < 0) {
                    // Insufficient balance — notify user
                    notificationService.sendNotification(userId,
                            "Autopay Failed",
                            "Insufficient balance to auto-pay installment of " + total + " TND due on " + installment.getDueDate(),
                            NotificationType.PAYMENT_REMINDER);
                    log.warn("[AutopayScheduler] User {} has insufficient balance for installment {}", userId, installment.getId());
                    return;
                }

                // Deduct from wallet
                wallet.setBalance(wallet.getBalance().subtract(total));
                userWalletRepository.save(wallet);

                boolean wasOverdue = installment.getStatus() == InstallmentStatus.OVERDUE;

                // Mark installment as paid
                installment.setStatus(InstallmentStatus.PAID);
                installment.setPaidDate(LocalDateTime.now());
                installmentRepository.save(installment);

                // Record transaction
                String ref = "AUTO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                transactionService.record(userId, total, "PAYMENT", "SUCCESS",
                        "Autopay — installment due " + installment.getDueDate(), ref);

                paymentBehaviorService.recordInstallmentPayment(userId, installment, wasOverdue);

                notificationService.sendNotification(userId,
                        "Autopay Successful",
                        "Auto-payment of " + total + " TND processed for installment due " + installment.getDueDate() + ". Ref: " + ref,
                        NotificationType.PAYMENT_CONFIRMED);

                log.info("[AutopayScheduler] Auto-paid installment {} for user {} — {} TND", installment.getId(), userId, total);
            });
        }

        log.info("[AutopayScheduler] Autopay job completed.");
    }
}
