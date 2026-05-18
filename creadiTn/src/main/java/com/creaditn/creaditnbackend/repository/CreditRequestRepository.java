package com.creaditn.creaditnbackend.repository;

import com.creaditn.creaditnbackend.entity.CreditRequest;
import com.creaditn.creaditnbackend.entity.CreditRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CreditRequestRepository extends JpaRepository<CreditRequest, Long> {
    List<CreditRequest> findByUserId(Long userId);
    List<CreditRequest> findByStatus(CreditRequestStatus status);
    List<CreditRequest> findByUserIdAndStatus(Long userId, CreditRequestStatus status);
    long countByStatus(CreditRequestStatus status);
}
