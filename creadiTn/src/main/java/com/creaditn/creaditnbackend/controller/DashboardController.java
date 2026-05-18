package com.creaditn.creaditnbackend.controller;

import com.creaditn.creaditnbackend.dto.CreadiScoreResponse;
import com.creaditn.creaditnbackend.dto.CreditBalanceResponse;
import com.creaditn.creaditnbackend.dto.DashboardResponse;
import com.creaditn.creaditnbackend.entity.Installment;
import com.creaditn.creaditnbackend.entity.InstallmentStatus;
import com.creaditn.creaditnbackend.entity.KycStatus;
import com.creaditn.creaditnbackend.entity.User;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.InstallmentRepository;
import com.creaditn.creaditnbackend.repository.UserRepository;
import com.creaditn.creaditnbackend.service.CardService;
import com.creaditn.creaditnbackend.service.CreadiScoreService;
import com.creaditn.creaditnbackend.service.CreditService;
import com.creaditn.creaditnbackend.service.FinancialProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final CreditService creditService;
    private final CreadiScoreService creadiScoreService;
    private final InstallmentRepository installmentRepository;
    private final UserRepository userRepository;
    private final CardService cardService;
    private final FinancialProfileService financialProfileService;

    @GetMapping
    public ResponseEntity<DashboardResponse> getDashboard(@RequestParam Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        CreditBalanceResponse balance = creditService.getCreditBalance(userId);
        CreadiScoreResponse score = creadiScoreService.getLatestScore(userId);

        List<Installment> installments = installmentRepository.findByCreditRequestUserId(userId);
        int activeLoans = (int) installments.stream()
                .filter(i -> i.getStatus() == InstallmentStatus.PENDING || i.getStatus() == InstallmentStatus.OVERDUE)
                .map(i -> i.getCreditRequest().getId())
                .distinct()
                .count();

        Installment nextInstallment = installments.stream()
                .filter(i -> i.getStatus() == InstallmentStatus.PENDING || i.getStatus() == InstallmentStatus.OVERDUE)
                .min(Comparator.comparing(Installment::getDueDate))
                .orElse(null);

        String kycSetup = user.getKycStatus() == KycStatus.APPROVED ? "DONE" : "PENDING";
        String cardSetup = cardService.hasActiveCard(userId) ? "DONE" : "MISSING";
        String profileSetup = financialProfileService.isCompleted(userId) ? "DONE" : "MISSING";

        String nextStep = "READY_FOR_CREDIT";
        if (!"DONE".equals(kycSetup)) {
            nextStep = "COMPLETE_KYC";
        } else if (!"DONE".equals(cardSetup)) {
            nextStep = "ADD_CARD";
        } else if (!"DONE".equals(profileSetup)) {
            nextStep = "COMPLETE_FINANCIAL_PROFILE";
        }

        DashboardResponse response = DashboardResponse.builder()
                .totalLimit(balance.getTotalLimit())
                .usedCredit(balance.getUsedCredit())
                .availableCredit(balance.getAvailableCredit())
                .outstandingPrincipal(balance.getOutstandingPrincipal())
                .outstandingPayable(balance.getOutstandingPayable())
                .activeLoans(activeLoans)
                .nextPaymentAmount(nextInstallment == null ? BigDecimal.ZERO : nextInstallment.getAmount().add(nextInstallment.getPenalty() == null ? BigDecimal.ZERO : nextInstallment.getPenalty()))
                .nextPaymentDate(nextInstallment == null ? null : nextInstallment.getDueDate().toString())
                .creditScore(score.getScore())
                .kycStatus(kycSetup)
                .cardStatus(cardSetup)
                .profileStatus(profileSetup)
                .nextStep(nextStep)
                .build();

        return ResponseEntity.ok(response);
    }
}
