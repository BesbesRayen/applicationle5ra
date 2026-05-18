package com.creaditn.creaditnbackend.controller;

import com.creaditn.creaditnbackend.dto.CreadiScoreResponse;
import com.creaditn.creaditnbackend.service.CreadiScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/creadi-score")
@RequiredArgsConstructor
public class CreadiScoreController {

    private final CreadiScoreService creadiScoreService;

    @PostMapping("/calculate/{userId}")
    public ResponseEntity<CreadiScoreResponse> calculateScore(@PathVariable Long userId) {
        return ResponseEntity.ok(creadiScoreService.calculateScore(userId));
    }

    @GetMapping("/latest")
    public ResponseEntity<CreadiScoreResponse> getLatestScore(@RequestParam Long userId) {
        return ResponseEntity.ok(creadiScoreService.getLatestScore(userId));
    }
}
