package com.creaditn.creaditnbackend.controller;

import com.creaditn.creaditnbackend.dto.*;
import com.creaditn.creaditnbackend.service.SupportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
public class SupportController {

    private final SupportService supportService;

    @GetMapping("/faq")
    public ResponseEntity<List<SupportFaqDto>> faq() {
        return ResponseEntity.ok(supportService.getFaq());
    }

    @GetMapping("/tickets")
    public ResponseEntity<List<SupportTicketDto>> tickets(@RequestParam Long userId) {
        return ResponseEntity.ok(supportService.getTickets(userId));
    }

    @PostMapping("/tickets")
    public ResponseEntity<SupportTicketDto> createTicket(
            @RequestParam Long userId,
            @Valid @RequestBody SupportTicketCreateRequest body) {
        return ResponseEntity.ok(supportService.createTicket(userId, body));
    }

    @PostMapping("/feedback")
    public ResponseEntity<ApiResponse> feedback(@Valid @RequestBody SupportFeedbackRequest body) {
        return ResponseEntity.ok(supportService.submitFeedback(body));
    }
}
