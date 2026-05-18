package com.creaditn.creaditnbackend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CreditRequestDto {

    @NotNull @Positive
    private BigDecimal totalAmount;

    @NotNull @Positive
    private BigDecimal downPayment;

    @NotNull
    private Integer numberOfInstallments;

    private String productName;

    // For simulation requests without merchant
    public static CreditRequestDto ofSimulation(CreditSimulationRequest req) {
        return CreditRequestDto.builder()
                .totalAmount(req.getTotalAmount())
                .downPayment(req.getDownPayment())
                .numberOfInstallments(req.getNumberOfInstallments())
                .build();
    }
}
