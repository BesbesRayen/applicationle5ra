package com.creaditn.creaditnbackend.controller;

import com.creaditn.creaditnbackend.dto.ApiResponse;
import com.creaditn.creaditnbackend.dto.AutopaySettingsDto;
import com.creaditn.creaditnbackend.dto.CardDto;
import com.creaditn.creaditnbackend.dto.PaymentDto;
import com.creaditn.creaditnbackend.dto.PaymentMethodDto;
import com.creaditn.creaditnbackend.dto.PayAllResponse;
import com.creaditn.creaditnbackend.dto.PaymentRequest;
import com.creaditn.creaditnbackend.entity.User;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.UserRepository;
import com.creaditn.creaditnbackend.repository.UserWalletRepository;
import com.creaditn.creaditnbackend.service.CardService;
import com.creaditn.creaditnbackend.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final CardService cardService;
    private final UserRepository userRepository;
    private final UserWalletRepository userWalletRepository;

    @PostMapping
    public ResponseEntity<PaymentDto> makePayment(
            @RequestParam Long userId,
            @Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.ok(paymentService.makePayment(userId, request));
    }

    /** Alias for mobile spec — body is optional; installmentId and amount can come from the path/service */
    @PostMapping("/installments/{installmentId}/pay")
    public ResponseEntity<PaymentDto> payInstallmentAlias(
            @PathVariable Long installmentId,
            @RequestParam Long userId,
            @RequestBody(required = false) PaymentRequest request) {
        if (request == null) {
            request = new PaymentRequest();
        }
        request.setInstallmentId(installmentId);
        // amount will be resolved by the service if not provided
        if (request.getAmount() == null) {
            request.setAmount(java.math.BigDecimal.ZERO); // service will use real amount
        }
        return ResponseEntity.ok(paymentService.makePayment(userId, request));
    }

    @GetMapping("/my-payments")
    public ResponseEntity<List<PaymentDto>> getMyPayments(@RequestParam Long userId) {
        return ResponseEntity.ok(paymentService.getUserPayments(userId));
    }

    @PostMapping({"/payAll", "/pay-all"})
    public ResponseEntity<PayAllResponse> payAllInstallments(@RequestParam Long userId) {
        return ResponseEntity.ok(paymentService.payAllInstallments(userId));
    }

    @GetMapping("/reference/{ref}")
    public ResponseEntity<PaymentDto> getByReference(@PathVariable String ref) {
        return ResponseEntity.ok(paymentService.getPaymentByReference(ref));
    }

    @GetMapping("/methods")
    public ResponseEntity<List<PaymentMethodDto>> getMethods(@RequestParam Long userId) {
        List<PaymentMethodDto> methods = cardService.getCards(userId).stream()
            .map(this::mapCardToMethod)
            .toList();

        return ResponseEntity.ok(methods);
    }

    @PutMapping("/autopay")
    public ResponseEntity<ApiResponse> setAutopay(
            @RequestParam Long userId,
            @RequestBody AutopaySettingsDto body) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setAutopay(body.isEnabled());
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("Autopay " + (body.isEnabled() ? "enabled" : "disabled")));
    }

    @GetMapping("/autopay")
    public ResponseEntity<Map<String, Object>> getAutopayStatus(@RequestParam Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(Map.of("enabled", Boolean.TRUE.equals(user.getAutopay())));
    }

    @GetMapping("/wallet-balance")
    public ResponseEntity<Map<String, Object>> getWalletBalance(@RequestParam Long userId) {
        return userWalletRepository.findByUserId(userId)
                .map(w -> ResponseEntity.ok(Map.<String, Object>of("balance", w.getBalance())))
                .orElse(ResponseEntity.ok(Map.of("balance", java.math.BigDecimal.ZERO)));
    }

    private PaymentMethodDto mapCardToMethod(CardDto card) {
        String masked = card.getMaskedNumber() == null ? "****" : card.getMaskedNumber();
        String last4 = masked.length() >= 4 ? masked.substring(masked.length() - 4) : masked;

        return PaymentMethodDto.builder()
                .id(card.getId())
                .type(card.getType().name())
                .last4(last4)
                .label(masked)
                .defaultMethod(Boolean.TRUE.equals(card.getDefaultCard()))
                .build();
    }
}
