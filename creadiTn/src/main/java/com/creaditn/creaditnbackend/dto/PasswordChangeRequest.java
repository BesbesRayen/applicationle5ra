package com.creaditn.creaditnbackend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class PasswordChangeRequest {
    @NotBlank
    private String oldPassword;
    @NotBlank
    private String newPassword;
}
