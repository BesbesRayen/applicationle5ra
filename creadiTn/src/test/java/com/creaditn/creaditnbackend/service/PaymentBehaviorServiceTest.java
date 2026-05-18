package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.entity.Installment;
import com.creaditn.creaditnbackend.entity.InstallmentStatus;
import com.creaditn.creaditnbackend.entity.User;
import com.creaditn.creaditnbackend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentBehaviorServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CreadiScoreService creadiScoreService;

    @InjectMocks
    private PaymentBehaviorService paymentBehaviorService;

    @Test
    void onTimePaymentIncreasesModifierWithinBounds() {
        User user = User.builder().id(7L).paymentScoreModifier(195).build();
        Installment installment = Installment.builder()
                .amount(new BigDecimal("50.00"))
                .dueDate(LocalDate.now().plusDays(1))
                .status(InstallmentStatus.PENDING)
                .build();

        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        paymentBehaviorService.recordInstallmentPayment(7L, installment, false);

        assertThat(user.getPaymentScoreModifier()).isEqualTo(200);
        verify(userRepository).save(user);
        verify(creadiScoreService).calculateScore(7L);
    }

    @Test
    void overdueMarkAppliesRiskPenaltyWithinBounds() {
        User user = User.builder().id(9L).paymentScoreModifier(-190).build();
        when(userRepository.findById(9L)).thenReturn(Optional.of(user));

        paymentBehaviorService.recordOverdue(9L);

        assertThat(user.getPaymentScoreModifier()).isEqualTo(-200);
        verify(userRepository).save(user);
        verify(creadiScoreService).calculateScore(9L);
    }
}
