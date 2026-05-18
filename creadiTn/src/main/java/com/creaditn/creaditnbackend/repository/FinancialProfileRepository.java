package com.creaditn.creaditnbackend.repository;

import com.creaditn.creaditnbackend.entity.FinancialProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FinancialProfileRepository extends JpaRepository<FinancialProfile, Long> {
    Optional<FinancialProfile> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}
