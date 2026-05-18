package com.creaditn.creaditnbackend.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PaymentMethodDto {
    private Long id;
    private String type;
    private String last4;
    private String label;
    private boolean defaultMethod;
}
