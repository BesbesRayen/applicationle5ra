package com.creaditn.creaditnbackend.dto;

import com.creaditn.creaditnbackend.entity.InstallmentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstallmentPlanItemDto {

    private Long installmentId;
    private LocalDate dueDate;
    private BigDecimal amount;
    private InstallmentStatus status;
}
