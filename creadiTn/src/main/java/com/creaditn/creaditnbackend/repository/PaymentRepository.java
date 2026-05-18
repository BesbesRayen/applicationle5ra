package com.creaditn.creaditnbackend.repository;

import com.creaditn.creaditnbackend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByUserId(Long userId);
    Optional<Payment> findByTransactionReference(String transactionReference);
    List<Payment> findByInstallmentId(Long installmentId);
}
