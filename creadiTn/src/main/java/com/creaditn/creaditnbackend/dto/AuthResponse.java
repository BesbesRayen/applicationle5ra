package com.creaditn.creaditnbackend.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AuthResponse {
    private Long userId;
    private String email;
    private String firstName;
    private String lastName;
    private String message;
    private String token;
    private Boolean emailVerified;
}
