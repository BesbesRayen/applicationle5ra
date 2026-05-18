package com.creaditn.creaditnbackend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "kyc_documents",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_kyc_cin_number", columnNames = "cin_number_unique"),
        @UniqueConstraint(name = "uq_kyc_front_hash", columnNames = "cin_front_hash"),
        @UniqueConstraint(name = "uq_kyc_back_hash", columnNames = "cin_back_hash"),
        @UniqueConstraint(name = "uq_kyc_didit_id", columnNames = "didit_identity_id")
    }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class KycDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String cinFrontUrl;
    private String cinBackUrl;
    private String selfieUrl;
    private String cinNumber;

    /**
     * Normalised CIN number stored in a separate column used for the UNIQUE constraint.
     * Populated from cinNumber after trimming/upper-casing so that the constraint is reliable.
     */
    @Column(name = "cin_number_unique")
    private String cinNumberUnique;

    /** SHA-256 hex hash of the CIN front image bytes — used to detect duplicate ID cards. */
    @Column(name = "cin_front_hash")
    private String cinFrontHash;

    /** SHA-256 hex hash of the CIN back image bytes. */
    @Column(name = "cin_back_hash")
    private String cinBackHash;

    /** Didit verification session / identity ID returned by the Didit API. */
    @Column(name = "didit_identity_id")
    private String diditIdentityId;

    /** Identity / document number extracted by Didit AI from the document (authoritative). */
    @Column(name = "extracted_identity_number")
    private String extractedIdentityNumber;

    private String ocrResult;
    private Double faceMatchScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private KycStatus status;

    private String adminComment;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = KycStatus.PENDING;
    }
}
