package com.creaditn.creaditnbackend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class SupportTicketCreateRequest {
    @NotBlank
    private String subject;
    private String message;
}
