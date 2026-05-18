package com.creaditn.creaditnbackend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class PaymentRequest {

    @NotNull
    private Long installmentId;

    @NotNull @Positive
    private BigDecimal amount;

    private String paymentMethod;
}
