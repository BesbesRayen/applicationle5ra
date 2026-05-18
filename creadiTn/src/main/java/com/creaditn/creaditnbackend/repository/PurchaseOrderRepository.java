package com.creaditn.creaditnbackend.repository;

import com.creaditn.creaditnbackend.entity.PurchaseOrder;
import com.creaditn.creaditnbackend.entity.PurchaseOrderStatus;
import com.creaditn.creaditnbackend.entity.PurchasePaymentType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    List<PurchaseOrder> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<PurchaseOrder> findByPaymentTypeOrderByCreatedAtDesc(PurchasePaymentType paymentType);

    long countByPaymentType(PurchasePaymentType paymentType);

    long countByStatus(PurchaseOrderStatus status);
}
