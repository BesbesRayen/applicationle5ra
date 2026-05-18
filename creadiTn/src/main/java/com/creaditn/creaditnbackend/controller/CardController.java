package com.creaditn.creaditnbackend.controller;

import com.creaditn.creaditnbackend.dto.CardCreateRequest;
import com.creaditn.creaditnbackend.dto.CardDto;
import com.creaditn.creaditnbackend.service.CardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cards")
@RequiredArgsConstructor
public class CardController {

    private final CardService cardService;

    @PostMapping("/add")
    public ResponseEntity<CardDto> addCard(
            @RequestParam Long userId,
            @Valid @RequestBody CardCreateRequest request
    ) {
        return ResponseEntity.ok(cardService.addCard(userId, request));
    }

    @GetMapping("/user")
    public ResponseEntity<List<CardDto>> getUserCards(@RequestParam Long userId) {
        return ResponseEntity.ok(cardService.getCards(userId));
    }

    @GetMapping("/default")
    public ResponseEntity<CardDto> getDefaultCard(@RequestParam Long userId) {
        return ResponseEntity.ok(cardService.getDefaultCard(userId));
    }

    @PutMapping("/set-default")
    public ResponseEntity<CardDto> setDefault(
            @RequestParam Long userId,
            @Valid @RequestBody SetDefaultCardRequest request
    ) {
        return ResponseEntity.ok(cardService.setDefaultCard(userId, request.getCardId()));
    }

    @DeleteMapping("/block")
    public ResponseEntity<CardDto> block(
            @RequestParam Long userId,
            @Valid @RequestBody BlockCardRequest request
    ) {
        return ResponseEntity.ok(cardService.blockCard(userId, request.getCardId()));
    }

    // Legacy endpoints for backward compatibility
    @PostMapping
    public ResponseEntity<CardDto> addCardLegacy(
            @RequestParam Long userId,
            @Valid @RequestBody CardCreateRequest request
    ) {
        return ResponseEntity.ok(cardService.addCard(userId, request));
    }

    @GetMapping
    public ResponseEntity<List<CardDto>> getCardsLegacy(@RequestParam Long userId) {
        return ResponseEntity.ok(cardService.getCards(userId));
    }

    @PutMapping("/{cardId}/default")
    public ResponseEntity<CardDto> setDefaultLegacy(
            @RequestParam Long userId,
            @PathVariable Long cardId
    ) {
        return ResponseEntity.ok(cardService.setDefaultCard(userId, cardId));
    }

    @PutMapping("/{cardId}/block")
    public ResponseEntity<CardDto> blockLegacy(
            @RequestParam Long userId,
            @PathVariable Long cardId
    ) {
        return ResponseEntity.ok(cardService.blockCard(userId, cardId));
    }
}

// Helper DTOs for request body binding
@lombok.Data
@lombok.NoArgsConstructor
@lombok.AllArgsConstructor
class SetDefaultCardRequest {
    private Long cardId;
}

@lombok.Data
@lombok.NoArgsConstructor
@lombok.AllArgsConstructor
class BlockCardRequest {
    private Long cardId;
}
