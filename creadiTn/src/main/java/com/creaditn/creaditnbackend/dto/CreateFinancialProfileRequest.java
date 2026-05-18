package com.creaditn.creaditnbackend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateFinancialProfileRequest {

    @NotNull(message = "Monthly salary is required")
    @Min(value = 0, message = "Salary must be greater than 0")
    private Double monthlySalary;

    @NotNull(message = "Salary day is required")
    @Min(value = 1)
    private Integer salaryDay;

    @NotNull(message = "Employment status is required")
    private String employmentStatus;
}
