package com.creaditn.creaditnbackend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class SupportFeedbackRequest {
    @Min(1) @Max(5)
    private int rating;
    @NotBlank
    private String comment;
}
