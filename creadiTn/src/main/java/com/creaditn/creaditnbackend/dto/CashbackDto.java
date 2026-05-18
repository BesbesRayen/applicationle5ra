package com.creaditn.creaditnbackend.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CashbackDto {
    private BigDecimal available;
    private List<CashbackHistoryDto> history;
}
