package com.creaditn.creaditnbackend.controller;

import com.creaditn.creaditnbackend.dto.KycDocumentDto;
import com.creaditn.creaditnbackend.dto.KycVerificationResultDto;
import com.creaditn.creaditnbackend.exception.UnauthorizedException;
import com.creaditn.creaditnbackend.security.JwtUtil;
import com.creaditn.creaditnbackend.service.KycService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/kyc")
@RequiredArgsConstructor
public class KycController {

    private final KycService kycService;
    private final JwtUtil jwtUtil;

    /**
     * Extracts the authenticated userId from the JWT bearer token in the request.
     * Returns null if no valid token is present (should not happen on authenticated endpoints).
     */
    private Long extractJwtUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        try {
            return jwtUtil.getUserIdFromToken(authHeader.substring(7));
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Validates that the userId in the request matches the authenticated JWT userId.
     * Throws UnauthorizedException if they do not match — prevents IDOR attacks.
     */
    private void enforceOwnership(HttpServletRequest request, Long requestedUserId) {
        Long jwtUserId = extractJwtUserId(request);
        if (jwtUserId != null && !jwtUserId.equals(requestedUserId)) {
            throw new UnauthorizedException("Cannot perform KYC operations for another user");
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<KycDocumentDto> uploadDocument(
            HttpServletRequest request,
            @RequestParam Long userId,
            @RequestParam String cinNumber,
            @RequestParam String cinFrontUrl,
            @RequestParam String cinBackUrl,
            @RequestParam String selfieUrl) {
        enforceOwnership(request, userId);
        return ResponseEntity.ok(kycService.submitKycDocuments(userId, cinNumber, cinFrontUrl, cinBackUrl, selfieUrl));
    }

    @PostMapping(value = "/upload-multipart", consumes = "multipart/form-data")
    public ResponseEntity<KycDocumentDto> uploadMultipart(
            HttpServletRequest request,
            @RequestParam Long userId,
            @RequestParam String cinNumber,
            @RequestParam("cinFront") MultipartFile cinFront,
            @RequestParam("cinBack") MultipartFile cinBack,
            @RequestParam(value = "selfie", required = false) MultipartFile selfie) throws IOException {
        enforceOwnership(request, userId);
        return ResponseEntity.ok(kycService.uploadMultipart(userId, cinNumber, cinFront, cinBack, selfie));
    }

    /**
     * Upload documents + run AI verification via Didit.
     * Accepts all KYC form data + images in a single multipart request.
     * The userId in the form must match the authenticated JWT userId.
     */
    @PostMapping(value = "/verify", consumes = "multipart/form-data")
    public ResponseEntity<KycVerificationResultDto> uploadAndVerify(
            HttpServletRequest request,
            @RequestParam Long userId,
            @RequestParam(required = false, defaultValue = "") String cinNumber,
            @RequestParam("cinFront") MultipartFile cinFront,
            @RequestParam("cinBack") MultipartFile cinBack,
            @RequestParam(value = "selfie", required = false) MultipartFile selfie,
            @RequestParam(required = false) String maritalStatus,
            @RequestParam(required = false) Integer numberOfChildren,
            @RequestParam(required = false) Double monthlySalary,
            @RequestParam(required = false) Boolean usIndicator) throws IOException {
        enforceOwnership(request, userId);
        return ResponseEntity.ok(kycService.uploadAndVerify(
                userId, cinNumber, cinFront, cinBack, selfie,
                maritalStatus, numberOfChildren, monthlySalary, usIndicator
        ));
    }

    @GetMapping("/status")
    public ResponseEntity<KycDocumentDto> getKycStatus(
            HttpServletRequest request,
            @RequestParam Long userId) {
        enforceOwnership(request, userId);
        return kycService.getLatestKycOptional(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
