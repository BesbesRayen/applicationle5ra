package com.creaditn.creaditnbackend.repository;

import com.creaditn.creaditnbackend.entity.KycDocument;
import com.creaditn.creaditnbackend.entity.KycStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface KycDocumentRepository extends JpaRepository<KycDocument, Long> {
    List<KycDocument> findByUserId(Long userId);
    Optional<KycDocument> findTopByUserIdOrderByCreatedAtDesc(Long userId);
    List<KycDocument> findByStatus(KycStatus status);
    long countByStatus(KycStatus status);

    /**
     * Returns true if the given CIN number is already associated with a PENDING or APPROVED
     * KYC document belonging to a DIFFERENT user. Used to prevent identity reuse across accounts.
     */
    boolean existsByCinNumberAndUser_IdNotAndStatusIn(String cinNumber, Long userId, List<KycStatus> statuses);

    /**
     * Returns true if the given CIN number is used by ANY KYC document (any status) belonging
     * to a different user. Prevents identity reuse even when the other account was rejected.
     */
    boolean existsByCinNumberAndUser_IdNot(String cinNumber, Long userId);

    /**
     * Hard identity lock: reject if the same CIN front image (by SHA-256 hash) was already used
     * by a different user — regardless of status.
     */
    boolean existsByCinFrontHashAndUser_IdNot(String cinFrontHash, Long userId);

    /**
     * Hard identity lock: same check for CIN back image.
     */
    boolean existsByCinBackHashAndUser_IdNot(String cinBackHash, Long userId);

    /**
     * Hard identity lock: reject if the same Didit identity ID is already linked to another user.
     */
    boolean existsByDiditIdentityIdAndUser_IdNot(String diditIdentityId, Long userId);
}
