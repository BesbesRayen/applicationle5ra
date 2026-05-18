package com.creaditn.creaditnbackend.controller;

import com.creaditn.creaditnbackend.dto.FinancialProfileDto;
import com.creaditn.creaditnbackend.dto.FinancialProfileRequest;
import com.creaditn.creaditnbackend.dto.CreateFinancialProfileRequest;
import com.creaditn.creaditnbackend.entity.EmploymentStatus;
import com.creaditn.creaditnbackend.service.FinancialProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class FinancialProfileController {

    private final FinancialProfileService financialProfileService;

    @PostMapping("/create")
    public ResponseEntity<FinancialProfileDto> createProfile(
            @RequestParam Long userId,
            @Valid @RequestBody CreateFinancialProfileRequest request
    ) {
        FinancialProfileRequest req = FinancialProfileRequest.builder()
                .monthlySalary(BigDecimal.valueOf(request.getMonthlySalary()))
                .salaryDay(request.getSalaryDay())
                .employmentStatus(EmploymentStatus.valueOf(request.getEmploymentStatus()))
                .build();
        return ResponseEntity.ok(financialProfileService.createOrUpdate(userId, req));
    }

    @GetMapping("/get")
    public ResponseEntity<FinancialProfileDto> getProfile(@RequestParam Long userId) {
        return ResponseEntity.ok(financialProfileService.getByUserId(userId));
    }

    @GetMapping("/has-profile")
    public ResponseEntity<HasProfileResponse> hasProfile(@RequestParam Long userId) {
        boolean exists = financialProfileService.isCompleted(userId);
        return ResponseEntity.ok(new HasProfileResponse(exists));
    }

    // Legacy endpoints
    @PostMapping
    public ResponseEntity<FinancialProfileDto> createOrUpdate(
            @RequestParam Long userId,
            @Valid @RequestBody FinancialProfileRequest request
    ) {
        return ResponseEntity.ok(financialProfileService.createOrUpdate(userId, request));
    }

    @GetMapping
    public ResponseEntity<FinancialProfileDto> getProfileLegacy(@RequestParam Long userId) {
        return ResponseEntity.ok(financialProfileService.getByUserId(userId));
    }
}

@lombok.Data
@lombok.NoArgsConstructor
@lombok.AllArgsConstructor
class HasProfileResponse {
    private boolean exists;
}
