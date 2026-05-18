package com.creaditn.creaditnbackend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class AuthRequest {

    @NotBlank @Email
    private String email;

    @NotBlank
    private String password;
}
