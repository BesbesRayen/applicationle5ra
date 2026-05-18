package com.creaditn.creaditnbackend.dto;

import com.creaditn.creaditnbackend.entity.EmploymentStatus;
import com.creaditn.creaditnbackend.entity.RiskLevel;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialProfileDto {
    private Long id;
    private Long userId;
    private BigDecimal monthlySalary;
    private Integer salaryDay;
    private EmploymentStatus employmentStatus;
    private RiskLevel riskLevel;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
