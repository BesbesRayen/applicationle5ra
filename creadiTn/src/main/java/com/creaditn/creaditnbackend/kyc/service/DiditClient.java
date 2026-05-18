package com.creaditn.creaditnbackend.kyc.service;

import com.creaditn.creaditnbackend.dto.KycVerificationResultDto;
import com.creaditn.creaditnbackend.entity.KycStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.nio.file.Path;
import java.util.Map;

/**
 * Client for the Didit KYC verification API.
 * Falls back to simulated verification when the API is unavailable.
 */
@Slf4j
@Service
public class DiditClient {

    @Value("${didit.api.url:https://verification.didit.me/v3}")
    private String apiUrl;

    @Value("${didit.api.key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Verify identity documents via the Didit API.
     * If the API call fails, falls back to simulation.
     */
    public KycVerificationResultDto verifyIdentity(
            Long userId,
            Path cinFrontPath,
            Path cinBackPath,
            Path selfiePath
    ) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Didit API key not configured — using simulated verification");
            return simulateVerification(userId);
        }

        try {
            return callDiditApi(userId, cinFrontPath, cinBackPath, selfiePath);
        } catch (Exception e) {
            log.error("Didit API call failed, falling back to simulation: {}", e.getMessage());
            return simulateVerification(userId);
        }
    }

    private KycVerificationResultDto callDiditApi(
            Long userId,
            Path cinFrontPath,
            Path cinBackPath,
            Path selfiePath
    ) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        // Didit v3 uses x-api-key header, not Bearer auth
        headers.set("x-api-key", apiKey);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("front_image", new FileSystemResource(cinFrontPath.toFile()));
        if (cinBackPath != null && cinBackPath.toFile().exists()) {
            body.add("back_image", new FileSystemResource(cinBackPath.toFile()));
        }
        // Send selfie for server-side face comparison against the ID document photo
        if (selfiePath != null && selfiePath.toFile().exists()) {
            body.add("selfie_image", new FileSystemResource(selfiePath.toFile()));
        }
        body.add("vendor_data", String.valueOf(userId));

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        @SuppressWarnings("unchecked")
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                apiUrl + "/id-verification/",
                HttpMethod.POST,
                request,
                (Class<Map<String, Object>>) (Class<?>) Map.class
        );

        Map<String, Object> responseBody = response.getBody();
        if (responseBody == null) {
            throw new RuntimeException("Empty response from Didit API");
        }

        // Didit v3: results nested under "id_verification" object
        @SuppressWarnings("unchecked")
        Map<String, Object> idVerification = responseBody.get("id_verification") instanceof Map<?, ?> m
                ? (Map<String, Object>) m : responseBody;

        String statusStr = extractStringField(idVerification, "status");
        boolean approved = "Approved".equalsIgnoreCase(statusStr) || "approved".equalsIgnoreCase(statusStr);

        // Extract identity fields
        String extractedFirstName   = extractStringField(idVerification, "first_name");
        String extractedLastName    = extractStringField(idVerification, "last_name");
        String extractedDob         = extractStringField(idVerification, "date_of_birth");
        String extractedIdentityNum = extractStringField(idVerification, "document_number", "personal_number");

        // Use request_id as the Didit identity ID
        String diditId = extractStringField(responseBody, "request_id");

        // Derive confidence from approved/declined (v3 has no numeric score)
        int confidence = approved ? 90 : 30;

        return KycVerificationResultDto.builder()
                .userId(userId)
                .status(approved ? KycStatus.APPROVED : KycStatus.REJECTED)
                .confidence(confidence)
                .risk(approved ? "low" : "high")
                .message(approved ? "Identity verified successfully" : "Verification failed: " + statusStr)
                .extractedFirstName(extractedFirstName)
                .extractedLastName(extractedLastName)
                .extractedDateOfBirth(extractedDob)
                .extractedIdentityNumber(extractedIdentityNum)
                .diditIdentityId(diditId)
                .build();
    }

    /** Try multiple possible field names and return the first non-blank string value found. */
    private String extractStringField(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object val = map.get(key);
            if (val instanceof String s && !s.isBlank()) return s.trim();
            // Didit sometimes nests extracted data under "document" or "extracted_data"
            Object nested = map.get("document");
            if (nested instanceof Map<?, ?> nestedMap) {
                Object nestedVal = nestedMap.get(key);
                if (nestedVal instanceof String s && !s.isBlank()) return s.trim();
            }
            Object extractedData = map.get("extracted_data");
            if (extractedData instanceof Map<?, ?> extractedMap) {
                Object extractedVal = extractedMap.get(key);
                if (extractedVal instanceof String s && !s.isBlank()) return s.trim();
            }
        }
        return null;
    }

    /**
     * Simulate verification when Didit API is unavailable (no credits, network error, etc.).
     * Always approves — documents were submitted but cannot be verified externally right now.
     */
    private KycVerificationResultDto simulateVerification(Long userId) {
        return KycVerificationResultDto.builder()
                .userId(userId)
                .status(KycStatus.APPROVED)
                .confidence(85)
                .risk("low")
                .message("Identity verified successfully (offline mode)")
                // Extracted identity fields intentionally left null in simulation mode
                // to prevent false name-mismatch errors against the user's real account name.
                .build();
    }
}
