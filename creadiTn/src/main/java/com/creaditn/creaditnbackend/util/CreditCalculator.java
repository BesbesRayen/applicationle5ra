package com.creaditn.creaditnbackend.util;

import lombok.experimental.UtilityClass;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * Utility class for credit-related calculations
 */
@UtilityClass
public class CreditCalculator {

    public static final BigDecimal DOWN_PAYMENT_RATIO = BigDecimal.valueOf(0.20);
    public static final int MONEY_SCALE = 2;

    /**
     * Calculate the monthly installment amount
     * @param totalAmount the total credit amount
     * @param downPayment the down payment amount
     * @param numberOfInstallments the number of installments
     * @return the monthly installment amount
     */
    public static BigDecimal calculateMonthlyAmount(
            BigDecimal totalAmount,
            BigDecimal downPayment,
            Integer numberOfInstallments) {
        return calculatePlan(totalAmount, downPayment, numberOfInstallments).monthlyAmount();
    }

    public static CreditPlan calculatePlan(
            BigDecimal totalAmount,
            BigDecimal downPayment,
            Integer numberOfInstallments) {
        if (totalAmount == null || downPayment == null || numberOfInstallments == null) {
            throw new IllegalArgumentException("Total amount, down payment and installment count are required");
        }
        if (totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Total amount must be positive");
        }
        if (downPayment.compareTo(BigDecimal.ZERO) < 0 || downPayment.compareTo(totalAmount) >= 0) {
            throw new IllegalArgumentException("Down payment must be positive and less than total amount");
        }

        BigDecimal normalizedTotal = money(totalAmount);
        BigDecimal normalizedDownPayment = money(downPayment);
        BigDecimal financedAmount = money(normalizedTotal.subtract(normalizedDownPayment));
        BigDecimal interestRate = getInterestRate(numberOfInstallments);
        BigDecimal interestAmount = money(financedAmount.multiply(interestRate));
        BigDecimal financedPayable = money(financedAmount.add(interestAmount));
        BigDecimal totalPayable = money(normalizedDownPayment.add(financedPayable));
        List<BigDecimal> installmentAmounts = allocateInstallments(financedPayable, numberOfInstallments);

        return new CreditPlan(
                normalizedTotal,
                normalizedDownPayment,
                interestRate,
                financedAmount,
                interestAmount,
                financedPayable,
                totalPayable,
                installmentAmounts.get(0),
                installmentAmounts
        );
    }

    public static BigDecimal getInterestRate(Integer numberOfInstallments) {
        return switch (numberOfInstallments) {
            case 3 -> BigDecimal.ZERO;
            case 6 -> BigDecimal.valueOf(0.03);
            case 9 -> BigDecimal.valueOf(0.06);
            case 12 -> BigDecimal.valueOf(0.12);
            default -> throw new IllegalArgumentException("Unsupported installment plan. Allowed values: 3, 6, 9, 12");
        };
    }

    public static BigDecimal requiredDownPayment(BigDecimal totalAmount) {
        return money(totalAmount.multiply(DOWN_PAYMENT_RATIO));
    }

    public static BigDecimal money(BigDecimal value) {
        return value.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private static List<BigDecimal> allocateInstallments(BigDecimal totalFinancedPayable, int numberOfInstallments) {
        BigDecimal regularAmount = totalFinancedPayable.divide(
                BigDecimal.valueOf(numberOfInstallments),
                MONEY_SCALE,
                RoundingMode.HALF_UP
        );

        List<BigDecimal> amounts = new ArrayList<>(numberOfInstallments);
        BigDecimal allocated = BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        for (int i = 1; i <= numberOfInstallments; i++) {
            BigDecimal amount = i == numberOfInstallments
                    ? money(totalFinancedPayable.subtract(allocated))
                    : regularAmount;
            amounts.add(amount);
            allocated = allocated.add(amount);
        }

        return amounts;
    }

    public record CreditPlan(
            BigDecimal totalAmount,
            BigDecimal downPayment,
            BigDecimal interestRate,
            BigDecimal financedAmount,
            BigDecimal interestAmount,
            BigDecimal financedPayable,
            BigDecimal totalPayable,
            BigDecimal monthlyAmount,
            List<BigDecimal> installmentAmounts
    ) {}
}
