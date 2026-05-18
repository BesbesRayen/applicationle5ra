package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.entity.Installment;
import com.creaditn.creaditnbackend.entity.InstallmentStatus;
import com.creaditn.creaditnbackend.entity.User;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class PaymentBehaviorService {

    private static final int ON_TIME_PAYMENT_DELTA = 10;
    private static final int LATE_PAYMENT_DELTA = -15;
    private static final int OVERDUE_MARK_DELTA = -20;
    private static final int MIN_MODIFIER = -200;
    private static final int MAX_MODIFIER = 200;

    private final UserRepository userRepository;
    private final CreadiScoreService creadiScoreService;

    @Transactional
    public void recordInstallmentPayment(Long userId, Installment installment, boolean wasOverdue) {
        boolean late = wasOverdue
                || installment.getStatus() == InstallmentStatus.OVERDUE
                || installment.getDueDate().isBefore(LocalDate.now());
        applyDelta(userId, late ? LATE_PAYMENT_DELTA : ON_TIME_PAYMENT_DELTA);
    }

    @Transactional
    public void recordOverdue(Long userId) {
        applyDelta(userId, OVERDUE_MARK_DELTA);
    }

    private void applyDelta(Long userId, int delta) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        int modifier = user.getPaymentScoreModifier() == null ? 0 : user.getPaymentScoreModifier();
        user.setPaymentScoreModifier(Math.max(MIN_MODIFIER, Math.min(MAX_MODIFIER, modifier + delta)));
        userRepository.save(user);
        creadiScoreService.calculateScore(userId);
    }
}
