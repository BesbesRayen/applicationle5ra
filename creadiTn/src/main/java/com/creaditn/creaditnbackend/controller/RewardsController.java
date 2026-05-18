package com.creaditn.creaditnbackend.controller;

import com.creaditn.creaditnbackend.dto.CashbackDto;
import com.creaditn.creaditnbackend.dto.CashbackHistoryDto;
import com.creaditn.creaditnbackend.dto.CashbackOfferDto;
import com.creaditn.creaditnbackend.service.RewardsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rewards")
@RequiredArgsConstructor
public class RewardsController {

    private final RewardsService rewardsService;

    @GetMapping("/cashback")
    public ResponseEntity<CashbackDto> getCashback(@RequestParam Long userId) {
        return ResponseEntity.ok(rewardsService.getCashback(userId));
    }

    @GetMapping("/offers")
    public ResponseEntity<List<CashbackOfferDto>> getOffers(@RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(rewardsService.getOffers(userId != null ? userId : 0L));
    }

    @GetMapping("/history")
    public ResponseEntity<List<CashbackHistoryDto>> getHistory(@RequestParam Long userId) {
        return ResponseEntity.ok(rewardsService.getHistory(userId));
    }
}
