package com.creaditn.creaditnbackend.repository;

import com.creaditn.creaditnbackend.entity.Card;
import com.creaditn.creaditnbackend.entity.CardStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CardRepository extends JpaRepository<Card, Long> {
    List<Card> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Card> findByUserIdAndIsDefaultTrue(Long userId);

    boolean existsByUserId(Long userId);

    boolean existsByUserIdAndStatus(Long userId, CardStatus status);
}
