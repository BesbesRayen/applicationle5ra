package com.creaditn.creaditnbackend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class ForgotPasswordRequest {
    @NotBlank
    private String identifier; // email or phone
}
