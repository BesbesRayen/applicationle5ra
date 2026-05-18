package com.creaditn.creaditnbackend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class ForgotPasswordConfirmRequest {
    @NotBlank
    private String identifier; // email or phone

    @NotBlank
    private String code;

    @NotBlank
    private String newPassword;
}
