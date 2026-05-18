package com.creaditn.creaditnbackend.controller;

import com.creaditn.creaditnbackend.dto.TransactionDto;
import com.creaditn.creaditnbackend.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping
    public ResponseEntity<List<TransactionDto>> getUserTransactions(@RequestParam Long userId) {
        return ResponseEntity.ok(transactionService.getUserTransactions(userId));
    }
}
