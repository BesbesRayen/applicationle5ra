package com.creaditn.creaditnbackend.scheduler;

import com.creaditn.creaditnbackend.entity.Installment;
import com.creaditn.creaditnbackend.entity.InstallmentStatus;
import com.creaditn.creaditnbackend.entity.NotificationType;
import com.creaditn.creaditnbackend.repository.InstallmentRepository;
import com.creaditn.creaditnbackend.service.InstallmentService;
import com.creaditn.creaditnbackend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OverdueInstallmentScheduler {

    private final InstallmentRepository installmentRepository;
    private final InstallmentService installmentService;
    private final NotificationService notificationService;

    /**
     * Runs every night at midnight to check for overdue installments.
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void checkOverdueInstallments() {
        log.info("Running overdue installment check...");

        int marked = installmentService.markOverdueInstallments();
        log.info("Marked {} installments as overdue.", marked);
    }

    /**
     * Sends payment reminders 3 days before due date.
     * Runs every day at 9:00 AM.
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void sendPaymentReminders() {
        log.info("Running payment reminder check...");

        LocalDate reminderDate = LocalDate.now().plusDays(3);
        List<Installment> upcomingInstallments = installmentRepository
                .findByStatusAndDueDateBefore(InstallmentStatus.PENDING, reminderDate.plusDays(1));

        for (Installment installment : upcomingInstallments) {
            if (!installment.getDueDate().isBefore(LocalDate.now())) {
                Long userId = installment.getCreditRequest().getUser().getId();
                notificationService.sendNotification(userId,
                        "Payment Reminder",
                        "You have an installment of " + installment.getAmount()
                                + " DT due on " + installment.getDueDate() + ".",
                        NotificationType.PAYMENT_REMINDER);
            }
        }

        log.info("Payment reminders sent.");
    }
}
