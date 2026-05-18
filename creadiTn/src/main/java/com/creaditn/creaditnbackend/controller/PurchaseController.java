package com.creaditn.creaditnbackend.controller;

import com.creaditn.creaditnbackend.dto.PurchaseArticleRequest;
import com.creaditn.creaditnbackend.dto.PurchaseOrderResponse;
import com.creaditn.creaditnbackend.service.PurchaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchases")
@RequiredArgsConstructor
public class PurchaseController {

    private final PurchaseService purchaseService;

    @PostMapping("/checkout")
    public ResponseEntity<PurchaseOrderResponse> checkout(
            @RequestParam Long userId,
            @Valid @RequestBody PurchaseArticleRequest request
    ) {
        return ResponseEntity.ok(purchaseService.checkout(userId, request));
    }

    @GetMapping("/my")
    public ResponseEntity<List<PurchaseOrderResponse>> getMyOrders(@RequestParam Long userId) {
        return ResponseEntity.ok(purchaseService.getUserOrders(userId));
    }
}
