package com.creaditn.creaditnbackend.dto;

import com.creaditn.creaditnbackend.entity.CardType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CardCreateRequest {
    @NotBlank
    private String cardNumber;

    @NotBlank
    @Pattern(regexp = "^(0[1-9]|1[0-2])\\/\\d{2}$", message = "Expiry date must follow MM/YY")
    private String expiryDate;

    private String cardholderName;

    @NotNull
    private CardType type;

    @Pattern(regexp = "^\\d{3,4}$", message = "CVV must be 3 or 4 digits")
    private String cvv;

    private Boolean defaultCard;
}
