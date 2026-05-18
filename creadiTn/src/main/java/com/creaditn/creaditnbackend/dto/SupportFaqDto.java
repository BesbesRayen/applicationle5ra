package com.creaditn.creaditnbackend.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class SupportFaqDto {
    private Long id;
    private String category;
    private String question;
    private String answer;
}
