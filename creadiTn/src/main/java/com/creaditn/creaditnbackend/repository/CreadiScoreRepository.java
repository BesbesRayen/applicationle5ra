package com.creaditn.creaditnbackend.repository;

import com.creaditn.creaditnbackend.entity.CreadiScore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CreadiScoreRepository extends JpaRepository<CreadiScore, Long> {
    Optional<CreadiScore> findTopByUserIdOrderByCreatedAtDesc(Long userId);
    List<CreadiScore> findByUserIdOrderByCreatedAtDesc(Long userId);
}
