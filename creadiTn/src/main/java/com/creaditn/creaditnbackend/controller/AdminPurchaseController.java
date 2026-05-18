package com.creaditn.creaditnbackend.controller;

import com.creaditn.creaditnbackend.dto.PurchaseOrderResponse;
import com.creaditn.creaditnbackend.service.PurchaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/purchases")
@RequiredArgsConstructor
public class AdminPurchaseController {

    private final PurchaseService purchaseService;

    @GetMapping("/credit")
    public ResponseEntity<List<PurchaseOrderResponse>> getCreditOrders() {
        return ResponseEntity.ok(purchaseService.getCreditOrdersForAdmin());
    }
}
