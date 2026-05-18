package com.creaditn.creaditnbackend.controller;

import com.creaditn.creaditnbackend.dto.*;
import com.creaditn.creaditnbackend.service.CreditService;
import com.creaditn.creaditnbackend.service.InstallmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/credits")
@RequiredArgsConstructor
public class CreditController {

    private final CreditService creditService;
    private final InstallmentService installmentService;

    @PostMapping("/simulate")
    public ResponseEntity<CreditSimulationResponse> simulate(@Valid @RequestBody CreditSimulationRequest request) {
        return ResponseEntity.ok(creditService.simulate(request));
    }

    @PostMapping("/request")
    public ResponseEntity<CreditRequestResponse> createRequest(
            @RequestParam Long userId,
            @Valid @RequestBody CreditRequestDto dto) {
        return ResponseEntity.ok(creditService.createCreditRequest(userId, dto));
    }

    @GetMapping("/my-requests")
    public ResponseEntity<List<CreditRequestResponse>> getMyRequests(@RequestParam Long userId) {
        return ResponseEntity.ok(creditService.getUserCreditRequests(userId));
    }

    /** Alias for mobile spec: GET /credits/my */
    @GetMapping("/my")
    public ResponseEntity<List<CreditRequestResponse>> getMyCreditsAlias(@RequestParam Long userId) {
        return ResponseEntity.ok(creditService.getUserCreditRequests(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CreditRequestResponse> getCreditRequest(@PathVariable Long id) {
        return ResponseEntity.ok(creditService.getCreditRequest(id));
    }

    @GetMapping("/balance")
    public ResponseEntity<CreditBalanceResponse> getCreditBalance(@RequestParam Long userId) {
        return ResponseEntity.ok(creditService.getCreditBalance(userId));
    }

    @GetMapping("/{creditId}/installments")
    public ResponseEntity<List<InstallmentDto>> getInstallments(@PathVariable Long creditId) {
        return ResponseEntity.ok(installmentService.getInstallmentsForCredit(creditId));
    }

    @GetMapping("/my-installments")
    public ResponseEntity<List<InstallmentDto>> getMyInstallments(@RequestParam Long userId) {
        return ResponseEntity.ok(installmentService.getUserInstallments(userId));
    }

    @GetMapping("/my-installments/pending")
    public ResponseEntity<List<InstallmentDto>> getMyPendingInstallments(@RequestParam Long userId) {
        return ResponseEntity.ok(installmentService.getUserPendingInstallments(userId));
    }
}
