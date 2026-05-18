package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.FinancialProfileDto;
import com.creaditn.creaditnbackend.dto.FinancialProfileRequest;
import com.creaditn.creaditnbackend.entity.*;
import com.creaditn.creaditnbackend.exception.BadRequestException;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.CardRepository;
import com.creaditn.creaditnbackend.repository.FinancialProfileRepository;
import com.creaditn.creaditnbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class FinancialProfileService {

    private final FinancialProfileRepository financialProfileRepository;
    private final UserRepository userRepository;
    private final CardRepository cardRepository;
    private final NotificationService notificationService;

    @Transactional
    public FinancialProfileDto createOrUpdate(Long userId, FinancialProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!cardRepository.existsByUserIdAndStatus(userId, CardStatus.ACTIVE)) {
            throw new BadRequestException("Add a payment method before completing your financial profile");
        }

        if (request.getSalaryDay() < 1 || request.getSalaryDay() > 31) {
            throw new BadRequestException("Salary day must be between 1 and 31");
        }

        FinancialProfile profile = financialProfileRepository.findByUserId(userId)
                .orElse(FinancialProfile.builder().user(user).build());

        profile.setMonthlySalary(request.getMonthlySalary());
        profile.setSalaryDay(request.getSalaryDay());
        profile.setEmploymentStatus(request.getEmploymentStatus());
        profile.setRiskLevel(calculateRiskLevel(request.getMonthlySalary()));

        // Keep legacy user salary synchronized with new profile model.
        user.setMonthlySalary(request.getMonthlySalary().doubleValue());
        userRepository.save(user);

        financialProfileRepository.save(profile);

        notificationService.sendNotification(
                userId,
                "Financial profile updated",
                "Your salary profile is now complete. You can request credit.",
                NotificationType.CREDIT_APPROVED
        );

        return toDto(profile);
    }

    public FinancialProfileDto getByUserId(Long userId) {
        FinancialProfile profile = financialProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Financial profile not found"));
        return toDto(profile);
    }

    public FinancialProfile getRequiredEntity(Long userId) {
        return financialProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("Complete your financial profile"));
    }

    public boolean isCompleted(Long userId) {
        return financialProfileRepository.existsByUserId(userId);
    }

    private RiskLevel calculateRiskLevel(BigDecimal salary) {
        if (salary.compareTo(BigDecimal.valueOf(800)) < 0) {
            return RiskLevel.HIGH;
        }
        if (salary.compareTo(BigDecimal.valueOf(1800)) < 0) {
            return RiskLevel.MODERATE;
        }
        return RiskLevel.LOW;
    }

    private FinancialProfileDto toDto(FinancialProfile profile) {
        return FinancialProfileDto.builder()
                .id(profile.getId())
                .userId(profile.getUser().getId())
                .monthlySalary(profile.getMonthlySalary())
                .salaryDay(profile.getSalaryDay())
                .employmentStatus(profile.getEmploymentStatus())
                .riskLevel(profile.getRiskLevel())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
