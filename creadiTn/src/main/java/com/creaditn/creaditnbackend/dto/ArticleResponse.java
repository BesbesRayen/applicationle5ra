package com.creaditn.creaditnbackend.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArticleResponse {

    private Long id;
    private String productName;
    private String description;
    private BigDecimal price;
    private String imageUrl;
    private String boutiqueName;
    private String category;
    private Boolean active;
    private String sourceUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
