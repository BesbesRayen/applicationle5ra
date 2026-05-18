package com.creaditn.creaditnbackend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArticleRequest {

    @NotBlank
    @Size(max = 160)
    private String productName;

    @NotBlank
    @Size(max = 2000)
    private String description;

    @NotNull
    @DecimalMin(value = "0.01")
    @Digits(integer = 10, fraction = 2)
    private BigDecimal price;

    @NotBlank
    @Size(max = 600)
    private String imageUrl;

    @NotBlank
    @Size(max = 160)
    private String boutiqueName;

    @NotBlank
    @Size(max = 100)
    private String category;

    @Size(max = 800)
    private String sourceUrl;
}
