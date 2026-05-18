package com.creaditn.creaditnbackend.controller;

import com.creaditn.creaditnbackend.dto.MerchantDto;
import com.creaditn.creaditnbackend.entity.Merchant;
import com.creaditn.creaditnbackend.repository.MerchantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/merchants")
@RequiredArgsConstructor
public class MerchantController {

    private final MerchantRepository merchantRepository;

    @GetMapping
    public ResponseEntity<List<MerchantDto>> getAllMerchants() {
        List<MerchantDto> merchants = merchantRepository.findByActiveTrue()
                .stream().map(this::mapToDto).toList();
        return ResponseEntity.ok(merchants);
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<MerchantDto>> getByCategory(@PathVariable String category) {
        List<MerchantDto> merchants = merchantRepository.findByCategory(category)
                .stream().map(this::mapToDto).toList();
        return ResponseEntity.ok(merchants);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MerchantDto> getMerchant(@PathVariable Long id) {
        Merchant merchant = merchantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Merchant not found"));
        return ResponseEntity.ok(mapToDto(merchant));
    }

    private MerchantDto mapToDto(Merchant m) {
        return MerchantDto.builder()
                .id(m.getId())
                .name(m.getName())
                .category(m.getCategory())
                .address(m.getAddress())
                .phone(m.getPhone())
                .email(m.getEmail())
                .logoUrl(m.getLogoUrl())
                .active(m.getActive())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
