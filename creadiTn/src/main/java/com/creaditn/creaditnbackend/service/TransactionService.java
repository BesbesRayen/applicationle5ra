package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.TransactionDto;
import com.creaditn.creaditnbackend.entity.Transaction;
import com.creaditn.creaditnbackend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;

    @Transactional
    public Transaction record(Long userId, BigDecimal amount, String type, String status, String description, String reference) {
        Transaction tx = Transaction.builder()
                .userId(userId)
                .amount(amount)
                .type(type)
                .status(status)
                .description(description)
                .reference(reference)
                .build();
        return transactionRepository.save(tx);
    }

    public List<TransactionDto> getUserTransactions(Long userId) {
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    private TransactionDto toDto(Transaction t) {
        return TransactionDto.builder()
                .id(t.getId())
                .userId(t.getUserId())
                .amount(t.getAmount())
                .type(t.getType())
                .status(t.getStatus())
                .description(t.getDescription())
                .reference(t.getReference())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
