package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.KycDocumentDto;
import com.creaditn.creaditnbackend.dto.KycVerificationResultDto;
import com.creaditn.creaditnbackend.entity.*;
import com.creaditn.creaditnbackend.exception.BadRequestException;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.kyc.service.DiditClient;
import com.creaditn.creaditnbackend.repository.KycDocumentRepository;
import com.creaditn.creaditnbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class KycService {

    private final KycDocumentRepository kycDocumentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final OcrService ocrService;
    private final DiditClient diditClient;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    public KycDocumentDto submitKycDocuments(Long userId, String cinNumber, String cinFrontUrl, String cinBackUrl, String selfieUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getKycStatus() == KycStatus.APPROVED) {
            throw new BadRequestException("KYC already approved");
        }

        // Use provided CIN number, or extract from image if not provided
        String extractedCinNumber = cinNumber;
        if (cinNumber == null || cinNumber.trim().isEmpty()) {
            extractedCinNumber = ocrService.extractCinNumber(cinFrontUrl);
        }

        // Reject if this CIN is already used by another account (any status)
        if (extractedCinNumber != null && !extractedCinNumber.isBlank()) {
            boolean cinTakenByOther = kycDocumentRepository.existsByCinNumberAndUser_IdNot(
                    extractedCinNumber.trim(),
                    userId
            );
            if (cinTakenByOther) {
                throw new BadRequestException(
                        "Cette pièce d'identité est déjà associée à un autre compte. " +
                        "Chaque identité ne peut être utilisée que par un seul utilisateur.");
            }
        }

        KycDocument doc = KycDocument.builder()
                .user(user)
                .cinFrontUrl(cinFrontUrl)
                .cinBackUrl(cinBackUrl)
                .selfieUrl(selfieUrl)
                .cinNumber(extractedCinNumber)
                .status(KycStatus.PENDING)
                .build();

        kycDocumentRepository.save(doc);

        user.setKycStatus(KycStatus.PENDING);
        userRepository.save(user);

        return mapToDto(doc);
    }

    public KycDocumentDto approveKyc(Long documentId, String adminComment) {
        KycDocument doc = kycDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("KYC document not found"));

        doc.setStatus(KycStatus.APPROVED);
        doc.setAdminComment(adminComment);
        kycDocumentRepository.save(doc);

        User user = doc.getUser();
        user.setKycStatus(KycStatus.APPROVED);
        userRepository.save(user);

        notificationService.sendNotification(user.getId(),
                "KYC Approved", "Your identity has been verified successfully.",
                NotificationType.KYC_VALIDATED);

        return mapToDto(doc);
    }

    public KycDocumentDto rejectKyc(Long documentId, String adminComment) {
        KycDocument doc = kycDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("KYC document not found"));

        doc.setStatus(KycStatus.REJECTED);
        doc.setAdminComment(adminComment);
        kycDocumentRepository.save(doc);

        User user = doc.getUser();
        user.setKycStatus(KycStatus.REJECTED);
        userRepository.save(user);

        notificationService.sendNotification(user.getId(),
                "KYC Rejected", "Your identity verification was rejected. Reason: " + adminComment,
                NotificationType.KYC_VALIDATED);

        return mapToDto(doc);
    }

    public List<KycDocumentDto> getPendingDocuments() {
        return kycDocumentRepository.findByStatus(KycStatus.PENDING)
                .stream().map(this::mapToDto).toList();
    }

    public Optional<KycDocumentDto> getLatestKycOptional(Long userId) {
        return kycDocumentRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
                .map(this::mapToDto);
    }

    @Transactional
    public KycDocumentDto uploadMultipart(Long userId, String cinNumber, MultipartFile cinFront, MultipartFile cinBack, MultipartFile selfie)
            throws IOException {
        if (cinFront == null || cinFront.isEmpty() || cinBack == null || cinBack.isEmpty()) {
            throw new BadRequestException("CIN front and CIN back are required");
        }

        // ── Compute image hashes before saving for duplicate detection ──
        byte[] frontBytes = cinFront.getBytes();
        byte[] backBytes  = cinBack.getBytes();
        String frontHash = sha256Hex(frontBytes);
        String backHash  = sha256Hex(backBytes);

        // ── Enforce HARD IDENTITY LOCK: reject if same image already used ──
        if (kycDocumentRepository.existsByCinFrontHashAndUser_IdNot(frontHash, userId)) {
            throw new BadRequestException(
                    "Cette pièce d'identité est déjà liée à un autre compte (image recto identique). " +
                    "Chaque identité ne peut être utilisée que par un seul utilisateur.");
        }
        if (kycDocumentRepository.existsByCinBackHashAndUser_IdNot(backHash, userId)) {
            throw new BadRequestException(
                    "Cette pièce d'identité est déjà liée à un autre compte (image verso identique). " +
                    "Chaque identité ne peut être utilisée que par un seul utilisateur.");
        }

        // ── Delete any existing PENDING or REJECTED KYC documents for this user ──
        // This prevents duplicate-entry errors on unique columns (hash, cin_number_unique)
        // when the same user retries verification. APPROVED docs are never deleted.
        List<KycDocument> existing = kycDocumentRepository.findByUserId(userId);
        List<KycDocument> toDelete = existing.stream()
                .filter(d -> d.getStatus() == KycStatus.PENDING || d.getStatus() == KycStatus.REJECTED)
                .toList();
        if (!toDelete.isEmpty()) {
            kycDocumentRepository.deleteAll(toDelete);
            kycDocumentRepository.flush();
        }

        // Resolve to absolute path if relative
        Path uploadPath = Paths.get(uploadDir);
        if (!uploadPath.isAbsolute()) {
            uploadPath = Paths.get(System.getProperty("user.dir"), uploadDir);
        }

        Path dir = uploadPath.resolve("kyc").resolve(String.valueOf(userId));
        Files.createDirectories(dir);
        String frontName = "cin_front.jpg";
        String backName = "cin_back.jpg";
        String selfieName = "selfie.jpg";
        cinFront.transferTo(dir.resolve(frontName).toFile());
        cinBack.transferTo(dir.resolve(backName).toFile());
        if (selfie != null && !selfie.isEmpty()) {
            selfie.transferTo(dir.resolve(selfieName).toFile());
        }

        String base = "/api/files/kyc/" + userId + "/";
        String selfieUrl = (selfie != null && !selfie.isEmpty()) ? base + selfieName : null;
        KycDocumentDto result = submitKycDocuments(userId, cinNumber, base + frontName, base + backName, selfieUrl);

        // ── Persist hashes so the unique constraint can enforce uniqueness ──
        kycDocumentRepository.findById(result.getId()).ifPresent(doc -> {
            doc.setCinFrontHash(frontHash);
            doc.setCinBackHash(backHash);
            if (cinNumber != null && !cinNumber.isBlank()) {
                doc.setCinNumberUnique(cinNumber.trim().toUpperCase());
            }
            kycDocumentRepository.save(doc);
        });

        return result;
    }

    /**
     * Upload documents + run AI verification via Didit API.
     * Returns verification result with confidence score and risk level.
     */
    public KycVerificationResultDto uploadAndVerify(
            Long userId,
            String cinNumber,
            MultipartFile cinFront,
            MultipartFile cinBack,
            MultipartFile selfie,
            String maritalStatus,
            Integer numberOfChildren,
            Double monthlySalary,
            Boolean usIndicator
    ) throws IOException {
        // 1. Save documents
        KycDocumentDto doc = uploadMultipart(userId, cinNumber, cinFront, cinBack, selfie);

        // 2. Resolve file paths for Didit
        Path uploadPath = Paths.get(uploadDir);
        if (!uploadPath.isAbsolute()) {
            uploadPath = Paths.get(System.getProperty("user.dir"), uploadDir);
        }
        Path userDir = uploadPath.resolve("kyc").resolve(String.valueOf(userId));
        Path frontPath = userDir.resolve("cin_front.jpg");
        Path backPath = userDir.resolve("cin_back.jpg");
        Path selfiePath = userDir.resolve("selfie.jpg");

        // 3. Call Didit for AI verification
        KycVerificationResultDto result = diditClient.verifyIdentity(
                userId, frontPath, backPath,
                (selfie != null && !selfie.isEmpty()) ? selfiePath : null
        );
        result.setDocumentId(doc.getId());

        // 3a. Hard identity lock: enforce Didit identity ID uniqueness
        if (result.getDiditIdentityId() != null && !result.getDiditIdentityId().isBlank()) {
            if (kycDocumentRepository.existsByDiditIdentityIdAndUser_IdNot(result.getDiditIdentityId(), userId)) {
                try { rejectKyc(doc.getId(), "Didit identity ID already linked to another account"); } catch (Exception ignored) {}
                throw new BadRequestException(
                        "Cette identité Didit est déjà liée à un autre compte. " +
                        "Chaque identité ne peut être utilisée que par un seul utilisateur.");
            }
            // Persist the Didit identity ID and extracted identity number for future checks
            kycDocumentRepository.findById(doc.getId()).ifPresent(d -> {
                d.setDiditIdentityId(result.getDiditIdentityId());
                if (result.getExtractedIdentityNumber() != null && !result.getExtractedIdentityNumber().isBlank()) {
                    d.setExtractedIdentityNumber(result.getExtractedIdentityNumber().trim().toUpperCase());
                    // Also update the unique constraint column with the Didit-verified number
                    d.setCinNumberUnique(result.getExtractedIdentityNumber().trim().toUpperCase());
                }
                kycDocumentRepository.save(d);
            });
        }

        // 3b. If APPROVED and Didit returned at least some identity fields, enforce all are present.
        // When no fields are extracted (e.g. simulation / fallback mode), skip this check entirely.
        boolean anyFieldExtracted = result.getExtractedFirstName() != null || result.getExtractedLastName() != null
                || result.getExtractedDateOfBirth() != null || result.getExtractedIdentityNumber() != null;
        if (result.getStatus() == KycStatus.APPROVED && anyFieldExtracted) {
            boolean identityComplete =
                    result.getExtractedFirstName() != null && !result.getExtractedFirstName().isBlank() &&
                    result.getExtractedLastName()  != null && !result.getExtractedLastName().isBlank() &&
                    result.getExtractedDateOfBirth() != null && !result.getExtractedDateOfBirth().isBlank() &&
                    result.getExtractedIdentityNumber() != null && !result.getExtractedIdentityNumber().isBlank();
            if (!identityComplete) {
                try { rejectKyc(doc.getId(), "Incomplete identity data returned by Didit"); } catch (Exception ignored) {}
                throw new BadRequestException(
                        "Impossible de récupérer les données d'identité complètes. " +
                        "Veuillez réessayer la vérification avec un document plus lisible.");
            }
        }

        // 3c. Identity name matching — only when Didit returned extracted fields (real API, not simulation)
        User userForMatch = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (result.getExtractedFirstName() != null || result.getExtractedLastName() != null) {
            boolean firstNameMatch = result.getExtractedFirstName() == null
                    || normalizeForMatch(result.getExtractedFirstName())
                       .contains(normalizeForMatch(userForMatch.getFirstName()))
                    || normalizeForMatch(userForMatch.getFirstName())
                       .contains(normalizeForMatch(result.getExtractedFirstName()));
            boolean lastNameMatch  = result.getExtractedLastName() == null
                    || normalizeForMatch(result.getExtractedLastName())
                       .contains(normalizeForMatch(userForMatch.getLastName()))
                    || normalizeForMatch(userForMatch.getLastName())
                       .contains(normalizeForMatch(result.getExtractedLastName()));

            if (!firstNameMatch || !lastNameMatch) {
                // Reject and store document as REJECTED
                try { rejectKyc(doc.getId(), "Identity mismatch: document name does not match account name"); } catch (Exception ignored) {}
                throw new BadRequestException(
                        "Les informations d'identité ne correspondent pas au document officiel. " +
                        "Veuillez vous assurer que votre prénom et nom correspondent à votre pièce d'identité.");
            }
        }

        // 4. Auto-approve or reject based on Didit result (resilient to transient DB errors)
        try {
            if (result.getStatus() == KycStatus.APPROVED) {
                approveKyc(doc.getId(), "Auto-approved by Didit AI (confidence: " + result.getConfidence() + "%)");
            } else {
                rejectKyc(doc.getId(), "Rejected by Didit AI: " + result.getMessage());
            }
        } catch (Exception dbEx) {
            log.warn("DB update after KYC verification failed (userId={}): {}", userId, dbEx.getMessage());
        }

        // 5. Update user's kyc provider and profile fields
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            user.setKycProvider("DIDIT");
            user.setKycSubmittedAt(java.time.LocalDateTime.now());
            if (maritalStatus != null && !maritalStatus.isBlank()) {
                user.setMaritalStatus(maritalStatus);
            }
            if (numberOfChildren != null) {
                user.setNumberOfChildren(numberOfChildren);
            }
            if (monthlySalary != null && monthlySalary > 0) {
                user.setMonthlySalary(monthlySalary);
            }
            if (usIndicator != null && usIndicator) {
                user.setKycFraudFlag(true);
            }
            // Track failed attempts on rejection
            if (result.getStatus() == KycStatus.REJECTED) {
                user.setKycFailedAttempts(
                        (user.getKycFailedAttempts() != null ? user.getKycFailedAttempts() : 0) + 1
                );
            }
            userRepository.save(user);
        } catch (Exception dbEx) {
            log.warn("Could not update user KYC provider (userId={}): {}", userId, dbEx.getMessage());
        }

        return result;
    }

    /** SHA-256 hex digest of arbitrary bytes. */
    private static String sha256Hex(byte[] data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(data));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    /** Normalize a name for comparison: lowercase, strip accents, remove punctuation and extra spaces. */
    private String normalizeForMatch(String name) {
        if (name == null) return "";
        String lower = name.toLowerCase();
        // Decompose accented chars, then remove non-ASCII
        String normalized = java.text.Normalizer.normalize(lower, java.text.Normalizer.Form.NFD)
                .replaceAll("[^\\p{ASCII}]", "")
                .replaceAll("[^a-z0-9 ]", "")
                .trim()
                .replaceAll("\\s+", " ");
        return normalized;
    }

    private KycDocumentDto mapToDto(KycDocument doc) {
        return KycDocumentDto.builder()
                .id(doc.getId())
                .userId(doc.getUser().getId())
                .cinFrontUrl(doc.getCinFrontUrl())
                .cinBackUrl(doc.getCinBackUrl())
                .selfieUrl(doc.getSelfieUrl())
                .cinNumber(doc.getCinNumber())
                .ocrResult(doc.getOcrResult())
                .faceMatchScore(doc.getFaceMatchScore())
                .status(doc.getStatus())
                .adminComment(doc.getAdminComment())
                .createdAt(doc.getCreatedAt())
                .build();
    }
}
