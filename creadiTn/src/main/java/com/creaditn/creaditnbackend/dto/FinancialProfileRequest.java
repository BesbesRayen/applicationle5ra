package com.creaditn.creaditnbackend.dto;

import com.creaditn.creaditnbackend.entity.EmploymentStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialProfileRequest {

    @NotNull
    @Positive
    private BigDecimal monthlySalary;

    @NotNull
    @Min(1)
    @Max(31)
    private Integer salaryDay;

    @NotNull
    private EmploymentStatus employmentStatus;
}
