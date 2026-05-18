package com.creaditn.creaditnbackend.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CashbackOfferDto {
    private Long id;
    private Long merchantId;
    private String merchantName;
    private BigDecimal percentage;
    private String expiryDate;
}
