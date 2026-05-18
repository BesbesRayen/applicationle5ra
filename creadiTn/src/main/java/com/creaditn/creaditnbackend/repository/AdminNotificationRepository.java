package com.creaditn.creaditnbackend.repository;

import com.creaditn.creaditnbackend.entity.AdminNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdminNotificationRepository extends JpaRepository<AdminNotification, Long> {

    List<AdminNotification> findAllByOrderByCreatedAtDesc();

    List<AdminNotification> findByReadFalseOrderByCreatedAtDesc();

    long countByReadFalse();
}
