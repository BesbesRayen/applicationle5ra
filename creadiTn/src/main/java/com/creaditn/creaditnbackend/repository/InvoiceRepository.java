package com.creaditn.creaditnbackend.repository;

import com.creaditn.creaditnbackend.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByOrderId(Long orderId);

    Optional<Invoice> findByTransactionId(String transactionId);

    List<Invoice> findAllByOrderByPurchaseDateDesc();

    List<Invoice> findByUserId(Long userId);
}
