package com.creaditn.creaditnbackend.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CashbackHistoryDto {
    private Long id;
    private BigDecimal amount;
    private String source;
    private String date;
}
