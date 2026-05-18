package com.creaditn.creaditnbackend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String password;

    private String phone;
    private String address;
    private String profession;
    private String profilePhotoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private KycStatus kycStatus;

    @Column(name = "kyc_fraud_flag", nullable = false)
    private Boolean kycFraudFlag;

    @Column(name = "kyc_provider", nullable = false)
    private String kycProvider;

    private String maritalStatus;
    private Integer numberOfChildren;
    private Double monthlySalary;
    private Integer paymentScoreModifier;

    @Column(name = "autopay", nullable = false)
    private Boolean autopay;

    private LocalDateTime kycSubmittedAt;
    private Integer kycFailedAttempts;

    @Column(name = "account_deleted", nullable = false)
    private Boolean accountDeleted;

    // ── Email verification ────────────────────────────────────────────────
    @Column(name = "email_verified", nullable = false)
    private Boolean emailVerified;

    @Column(name = "email_verification_otp")
    private String emailVerificationOtp;

    @Column(name = "email_verification_otp_expiry")
    private LocalDateTime emailVerificationOtpExpiry;

    @Column(name = "email_verification_attempts")
    private Integer emailVerificationAttempts;

    @Column(name = "email_verification_sent_at")
    private LocalDateTime emailVerificationSentAt;

    @Column(name = "email_verified_at")
    private LocalDateTime emailVerifiedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (kycStatus == null) kycStatus = KycStatus.NOT_SUBMITTED;
        if (kycFraudFlag == null) kycFraudFlag = false;
        if (kycProvider == null || kycProvider.isBlank()) kycProvider = "LEGACY";
        if (kycFailedAttempts == null) kycFailedAttempts = 0;
        if (paymentScoreModifier == null) paymentScoreModifier = 0;
        if (autopay == null) autopay = false;
        if (accountDeleted == null) accountDeleted = false;
        if (emailVerified == null) emailVerified = false;
        if (emailVerificationAttempts == null) emailVerificationAttempts = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
