package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.InstallmentDto;
import com.creaditn.creaditnbackend.entity.*;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.FinancialProfileRepository;
import com.creaditn.creaditnbackend.repository.InstallmentRepository;
import com.creaditn.creaditnbackend.util.CreditCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InstallmentService {

    private final InstallmentRepository installmentRepository;
    private final FinancialProfileRepository financialProfileRepository;
    private final PaymentBehaviorService paymentBehaviorService;
    private final NotificationService notificationService;

    public void generateInstallments(CreditRequest creditRequest) {
        int count = creditRequest.getNumberOfInstallments();
        BigDecimal financedPayable = creditRequest.getTotalPayable() != null
                ? creditRequest.getTotalPayable().subtract(creditRequest.getDownPayment())
                : creditRequest.getMonthlyAmount().multiply(BigDecimal.valueOf(count));
        CreditCalculator.CreditPlan plan = CreditCalculator.calculatePlan(
                creditRequest.getTotalAmount(),
                creditRequest.getDownPayment(),
                count
        );
        List<BigDecimal> amounts = plan.totalPayable().subtract(plan.downPayment()).compareTo(financedPayable) == 0
                ? plan.installmentAmounts()
                : allocateInstallments(financedPayable, count);
        Integer salaryDay = financialProfileRepository.findByUserId(creditRequest.getUser().getId())
                .map(FinancialProfile::getSalaryDay)
                .orElse(25);

        LocalDate firstDueDate = calculateFirstDueDate(salaryDay);

        List<Installment> installments = new ArrayList<>();
        for (int i = 1; i <= count; i++) {
            Installment installment = Installment.builder()
                    .creditRequest(creditRequest)
                    .dueDate(firstDueDate.plusMonths(i - 1L))
                    .amount(amounts.get(i - 1))
                    .status(InstallmentStatus.PENDING)
                    .penalty(BigDecimal.ZERO)
                    .build();
            installments.add(installment);
        }
        installmentRepository.saveAll(installments);
    }

    public List<InstallmentDto> getInstallmentsForCredit(Long creditRequestId) {
        return installmentRepository.findByCreditRequestId(creditRequestId)
                .stream().map(this::mapToDto).toList();
    }

    public List<InstallmentDto> getAllInstallments() {
        return installmentRepository.findAll()
                .stream().map(this::mapToDto).toList();
    }

    public List<InstallmentDto> getUserInstallments(Long userId) {
        return installmentRepository.findByCreditRequestUserId(userId)
                .stream().map(this::mapToDto).toList();
    }

    public List<InstallmentDto> getUserPendingInstallments(Long userId) {
        return installmentRepository.findByCreditRequestUserIdAndStatus(userId, InstallmentStatus.PENDING)
                .stream().map(this::mapToDto).toList();
    }

    public Installment getInstallmentEntity(Long id) {
        return installmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Installment not found with id: " + id));
    }

    public void markAsPaid(Long installmentId) {
        Installment installment = getInstallmentEntity(installmentId);
        installment.setStatus(InstallmentStatus.PAID);
        installment.setPaidDate(LocalDateTime.now());
        installmentRepository.save(installment);
    }

    public List<Installment> getUserUnpaidInstallments(Long userId) {
        List<Installment> pending = installmentRepository
                .findByCreditRequestUserIdAndStatus(userId, InstallmentStatus.PENDING);
        List<Installment> overdue = installmentRepository
                .findByCreditRequestUserIdAndStatus(userId, InstallmentStatus.OVERDUE);

        List<Installment> unpaid = new ArrayList<>(pending.size() + overdue.size());
        unpaid.addAll(pending);
        unpaid.addAll(overdue);
        return unpaid;
    }

    @Transactional
    public int markAllAsPaid(List<Installment> installments) {
        if (installments.isEmpty()) {
            return 0;
        }

        LocalDateTime paidAt = LocalDateTime.now();
        for (Installment installment : installments) {
            installment.setStatus(InstallmentStatus.PAID);
            installment.setPaidDate(paidAt);
        }

        installmentRepository.saveAll(installments);
        return installments.size();
    }

    public int markOverdueInstallments() {
        List<Installment> overdue = installmentRepository
                .findByStatusAndDueDateBefore(InstallmentStatus.PENDING, LocalDate.now());

        for (Installment inst : overdue) {
            inst.setStatus(InstallmentStatus.OVERDUE);
            inst.setPenalty(CreditCalculator.money(inst.getAmount().multiply(BigDecimal.valueOf(0.05))));
            paymentBehaviorService.recordOverdue(inst.getCreditRequest().getUser().getId());
            notificationService.sendNotification(
                    inst.getCreditRequest().getUser().getId(),
                    "Installment Overdue",
                    "Your installment of " + inst.getAmount() + " DT due on "
                            + inst.getDueDate() + " is overdue. A 5% penalty has been applied.",
                    NotificationType.INSTALLMENT_OVERDUE
            );
        }
        installmentRepository.saveAll(overdue);
        return overdue.size();
    }

    private List<BigDecimal> allocateInstallments(BigDecimal total, int count) {
        BigDecimal regular = total.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
        List<BigDecimal> amounts = new ArrayList<>(count);
        BigDecimal allocated = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        for (int i = 1; i <= count; i++) {
            BigDecimal amount = i == count ? CreditCalculator.money(total.subtract(allocated)) : regular;
            amounts.add(amount);
            allocated = allocated.add(amount);
        }
        return amounts;
    }

    private LocalDate calculateFirstDueDate(Integer salaryDay) {
        LocalDate now = LocalDate.now();
        int dueDay = Math.min(salaryDay + 2, now.lengthOfMonth());
        LocalDate dueThisMonth = now.withDayOfMonth(dueDay);

        if (dueThisMonth.isAfter(now)) {
            return dueThisMonth;
        }

        LocalDate nextMonth = now.plusMonths(1);
        int nextMonthDueDay = Math.min(salaryDay + 2, nextMonth.lengthOfMonth());
        return nextMonth.withDayOfMonth(nextMonthDueDay);
    }

    private InstallmentDto mapToDto(Installment i) {
        CreditRequest cr = i.getCreditRequest();
        BigDecimal penalty = i.getPenalty() != null ? i.getPenalty() : BigDecimal.ZERO;
        BigDecimal remainingAmount = i.getStatus() == InstallmentStatus.PAID
            ? BigDecimal.ZERO
            : i.getAmount().add(penalty);

        return InstallmentDto.builder()
                .id(i.getId())
                .creditRequestId(cr.getId())
            .userId(cr.getUser().getId())
                .productName(cr.getProductName())
                .totalAmount(cr.getTotalAmount())
                .dueDate(i.getDueDate())
                .amount(i.getAmount())
            .remainingAmount(remainingAmount)
                .status(i.getStatus())
                .paidDate(i.getPaidDate())
            .penalty(penalty)
                .build();
    }
}
