package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.*;
import com.creaditn.creaditnbackend.entity.*;
import com.creaditn.creaditnbackend.exception.BadRequestException;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.CreditRequestRepository;
import com.creaditn.creaditnbackend.repository.InstallmentRepository;
import com.creaditn.creaditnbackend.repository.UserRepository;
import com.creaditn.creaditnbackend.util.CreditCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CreditService {

    private final CreditRequestRepository creditRequestRepository;
    private final UserRepository userRepository;
    private final InstallmentRepository installmentRepository;
    private final InstallmentService installmentService;
    private final NotificationService notificationService;
    private final CreadiScoreService creadiScoreService;
        private final CardService cardService;
        private final FinancialProfileService financialProfileService;

    public CreditSimulationResponse simulate(CreditSimulationRequest request) {
        BigDecimal requiredDownPayment = CreditCalculator.requiredDownPayment(request.getTotalAmount());
        BigDecimal effectiveDownPayment = request.getDownPayment().max(requiredDownPayment);

        if (request.getNumberOfInstallments() == null) {
            throw new BadRequestException("Installment duration is required");
        }

        CreditCalculator.CreditPlan plan = CreditCalculator.calculatePlan(
                request.getTotalAmount(),
                effectiveDownPayment,
                request.getNumberOfInstallments()
        );

        return CreditSimulationResponse.builder()
                .totalAmount(plan.totalAmount())
                .downPayment(plan.downPayment())
                .financedAmount(plan.financedAmount())
                .remainingPrincipal(plan.financedAmount())
                .remainingAmount(plan.financedAmount())
                .interestRate(plan.interestRate())
                .interestAmount(plan.interestAmount())
                .totalPayable(plan.totalPayable())
                .numberOfInstallments(request.getNumberOfInstallments())
                .monthlyAmount(plan.monthlyAmount())
                .build();
    }

    @Transactional
    public CreditRequestResponse createCreditRequest(Long userId, CreditRequestDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getKycStatus() != KycStatus.APPROVED) {
            throw new BadRequestException("KYC must be approved before requesting credit");
        }

                if (!cardService.hasActiveCard(userId)) {
                        throw new BadRequestException("Add a payment method");
                }
                cardService.getDefaultActiveCard(userId);

                if (!financialProfileService.isCompleted(userId)) {
                        throw new BadRequestException("Complete your financial profile");
                }

                BigDecimal requiredDownPayment = CreditCalculator.requiredDownPayment(dto.getTotalAmount());
                if (dto.getDownPayment().compareTo(requiredDownPayment) < 0) {
                        throw new BadRequestException("A 20% down payment is required");
                }

        CreditCalculator.CreditPlan plan = CreditCalculator.calculatePlan(
                dto.getTotalAmount(),
                dto.getDownPayment(),
                dto.getNumberOfInstallments()
        );

        // Check available credit (limit minus already used)
        CreditBalanceResponse balance = getCreditBalance(userId);
        BigDecimal availableCredit = balance.getAvailableCredit();

        if (availableCredit.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Aucun crédit disponible. Complétez votre KYC et renseignez votre salaire.");
        }
        if (plan.financedAmount().compareTo(availableCredit) > 0) {
            throw new BadRequestException("Requested amount exceeds your available credit of " + availableCredit.intValue() + " TND");
        }

        CreditRequestStatus status = determineStatus(userId);

        CreditRequest request = CreditRequest.builder()
                .user(user)
                .productName(dto.getProductName())
                .totalAmount(dto.getTotalAmount())
                .downPayment(dto.getDownPayment())
                .financedAmount(plan.financedAmount())
                .interestRate(plan.interestRate())
                .interestAmount(plan.interestAmount())
                .totalPayable(plan.totalPayable())
                .numberOfInstallments(dto.getNumberOfInstallments())
                .monthlyAmount(plan.monthlyAmount())
                .status(status)
                .build();

        creditRequestRepository.save(request);

        if (status == CreditRequestStatus.APPROVED) {
            installmentService.generateInstallments(request);
            notificationService.sendNotification(userId,
                    "Credit Approved", "Your credit request of " + dto.getTotalAmount() + " DT has been approved.",
                    NotificationType.CREDIT_APPROVED);
        }

        return mapToResponse(request);
    }

    @Transactional
    public CreditRequestResponse approveCreditRequest(Long requestId) {
        CreditRequest request = creditRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Credit request not found"));

        request.setStatus(CreditRequestStatus.APPROVED);
        creditRequestRepository.save(request);

        installmentService.generateInstallments(request);

        notificationService.sendNotification(request.getUser().getId(),
                "Credit Approved", "Your credit request has been approved.",
                NotificationType.CREDIT_APPROVED);

        return mapToResponse(request);
    }

    @Transactional
    public CreditRequestResponse rejectCreditRequest(Long requestId) {
        CreditRequest request = creditRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Credit request not found"));

        request.setStatus(CreditRequestStatus.REJECTED);
        creditRequestRepository.save(request);

        notificationService.sendNotification(request.getUser().getId(),
                "Credit Rejected", "Your credit request has been rejected.",
                NotificationType.CREDIT_REJECTED);

        return mapToResponse(request);
    }

    public List<CreditRequestResponse> getUserCreditRequests(Long userId) {
        return creditRequestRepository.findByUserId(userId)
                .stream().map(this::mapToResponse).toList();
    }

    public List<CreditRequestResponse> getPendingRequests() {
        return creditRequestRepository.findByStatus(CreditRequestStatus.PENDING)
                .stream().map(this::mapToResponse).toList();
    }

    public List<CreditRequestResponse> getAllRequests() {
        return creditRequestRepository.findAll()
                .stream().map(this::mapToResponse).toList();
    }

    public CreditRequestResponse getCreditRequest(Long id) {
        CreditRequest request = creditRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Credit request not found"));
        return mapToResponse(request);
    }

    public CreditBalanceResponse getCreditBalance(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        BigDecimal totalLimit = BigDecimal.valueOf(creadiScoreService.computeCreditLimitForUser(userId))
                .setScale(2, RoundingMode.HALF_UP);

        // Fallback: if the user's salary/profile is missing but they already had approved credit
        // and KYC is approved, restore a reusable limit based on their prior approved credit history.
        if (totalLimit.compareTo(BigDecimal.ZERO) <= 0 && user.getKycStatus() == KycStatus.APPROVED) {
            List<CreditRequest> approvedHistory = creditRequestRepository
                    .findByUserIdAndStatus(userId, CreditRequestStatus.APPROVED);

            BigDecimal historyLimit = approvedHistory.stream()
                    .map(request -> request.getFinancedAmount() != null
                            ? request.getFinancedAmount()
                            : request.getTotalAmount().subtract(request.getDownPayment()))
                    .max(BigDecimal::compareTo)
                    .orElse(BigDecimal.ZERO);

            if (historyLimit.compareTo(BigDecimal.ZERO) > 0) {
                totalLimit = historyLimit.max(new BigDecimal("1000.00")).setScale(2, RoundingMode.HALF_UP);
            }
        }

        // Used credit = sum of UNPAID installments (PENDING + OVERDUE)
        // As user pays installments, usedCredit decreases → available credit is restored
        List<Installment> pendingInstallments = installmentRepository
                .findByCreditRequestUserIdAndStatus(userId, InstallmentStatus.PENDING);
        List<Installment> overdueInstallments = installmentRepository
                .findByCreditRequestUserIdAndStatus(userId, InstallmentStatus.OVERDUE);

        BigDecimal pendingPayable = pendingInstallments.stream()
                .map(Installment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal overduePayable = overdueInstallments.stream()
                .map(i -> i.getAmount().add(i.getPenalty() != null ? i.getPenalty() : BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal usedCredit = pendingPayable.add(overduePayable).setScale(2, RoundingMode.HALF_UP);

        BigDecimal outstandingPrincipal = List.of(pendingInstallments, overdueInstallments).stream()
                .flatMap(List::stream)
                .map(i -> {
                    CreditRequest request = i.getCreditRequest();
                    BigDecimal principal = request.getFinancedAmount() != null
                            ? request.getFinancedAmount()
                            : request.getTotalAmount().subtract(request.getDownPayment());
                    return principal.divide(BigDecimal.valueOf(request.getNumberOfInstallments()), 8, RoundingMode.HALF_UP);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal available = totalLimit.subtract(usedCredit).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

        return CreditBalanceResponse.builder()
                .totalLimit(totalLimit)
                .usedCredit(usedCredit)
                .availableCredit(available)
                .outstandingPrincipal(outstandingPrincipal)
                .outstandingPayable(usedCredit)
                .build();
    }

    private CreditRequestStatus determineStatus(Long userId) {
        // Approval requires KYC + active default card + completed financial profile.
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getKycStatus() == KycStatus.APPROVED
                && cardService.hasActiveCard(userId)
                && financialProfileService.isCompleted(userId)) {
            return CreditRequestStatus.APPROVED;
        }
        return CreditRequestStatus.REJECTED;
    }

    private CreditRequestResponse mapToResponse(CreditRequest r) {
        return CreditRequestResponse.builder()
                .id(r.getId())
                .userId(r.getUser().getId())
                .productName(r.getProductName())
                .totalAmount(r.getTotalAmount())
                .downPayment(r.getDownPayment())
                .financedAmount(r.getFinancedAmount())
                .remainingPrincipal(r.getFinancedAmount())
                .interestRate(r.getInterestRate())
                .interestAmount(r.getInterestAmount())
                .totalPayable(r.getTotalPayable())
                .numberOfInstallments(r.getNumberOfInstallments())
                .monthlyAmount(r.getMonthlyAmount())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
