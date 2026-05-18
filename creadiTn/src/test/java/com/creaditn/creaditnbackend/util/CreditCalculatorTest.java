package com.creaditn.creaditnbackend.util;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class CreditCalculatorTest {

    @Test
    void appliesInterestOnlyOnFinancedAmount() {
        CreditCalculator.CreditPlan plan = CreditCalculator.calculatePlan(
                new BigDecimal("1000.00"),
                new BigDecimal("200.00"),
                12
        );

        assertThat(plan.financedAmount()).isEqualByComparingTo("800.00");
        assertThat(plan.interestRate()).isEqualByComparingTo("0.12");
        assertThat(plan.interestAmount()).isEqualByComparingTo("96.00");
        assertThat(plan.totalPayable()).isEqualByComparingTo("1096.00");
        assertThat(plan.monthlyAmount()).isEqualByComparingTo("74.67");
    }

    @Test
    void reconcilesRoundedInstallmentsExactlyToFinancedPayable() {
        CreditCalculator.CreditPlan plan = CreditCalculator.calculatePlan(
                new BigDecimal("999.99"),
                new BigDecimal("200.00"),
                6
        );

        BigDecimal allocated = plan.installmentAmounts().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertThat(allocated).isEqualByComparingTo(plan.financedPayable());
        assertThat(plan.totalPayable()).isEqualByComparingTo(plan.downPayment().add(allocated));
    }

    @Test
    void zeroInterestPlanStillUsesFinancedAmount() {
        CreditCalculator.CreditPlan plan = CreditCalculator.calculatePlan(
                new BigDecimal("500.00"),
                new BigDecimal("100.00"),
                3
        );

        assertThat(plan.interestAmount()).isEqualByComparingTo("0.00");
        assertThat(plan.totalPayable()).isEqualByComparingTo("500.00");
        assertThat(plan.financedPayable()).isEqualByComparingTo("400.00");
    }
}
