package com.creaditn.creaditnbackend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class CreditSimulationRequest {

    @NotNull @Positive
    private BigDecimal totalAmount;

    @NotNull @Positive
    private BigDecimal downPayment;

    @NotNull
    private Integer numberOfInstallments;
}
