package com.creaditn.creaditnbackend.scheduler;

import com.creaditn.creaditnbackend.entity.Installment;
import com.creaditn.creaditnbackend.entity.InstallmentStatus;
import com.creaditn.creaditnbackend.entity.NotificationType;
import com.creaditn.creaditnbackend.repository.InstallmentRepository;
import com.creaditn.creaditnbackend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentReminderScheduler {

    private final InstallmentRepository installmentRepository;
    private final NotificationService notificationService;

    /**
     * Sends reminders every day at 09:00 for installments due tomorrow.
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void sendDueDateReminders() {
        LocalDate dueTomorrow = LocalDate.now().plusDays(1);
        List<Installment> dueSoon = installmentRepository.findByStatusAndDueDate(InstallmentStatus.PENDING, dueTomorrow);

        for (Installment installment : dueSoon) {
            Long userId = installment.getCreditRequest().getUser().getId();
            String articleName = installment.getCreditRequest().getProductName();
            String message = "Reminder: installment for " + articleName
                    + " is due tomorrow (" + dueTomorrow + ") amount " + installment.getAmount() + " TND.";

            notificationService.sendNotification(
                    userId,
                    "Payment reminder",
                    message,
                    NotificationType.PAYMENT_REMINDER
            );
        }

        if (!dueSoon.isEmpty()) {
            log.info("[PaymentReminderScheduler] Sent {} reminder(s) for due date {}", dueSoon.size(), dueTomorrow);
        }
    }
}
