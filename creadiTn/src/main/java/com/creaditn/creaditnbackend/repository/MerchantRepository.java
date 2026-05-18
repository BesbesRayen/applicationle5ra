package com.creaditn.creaditnbackend.repository;

import com.creaditn.creaditnbackend.entity.Merchant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MerchantRepository extends JpaRepository<Merchant, Long> {
    List<Merchant> findByActiveTrue();
    List<Merchant> findByCategory(String category);
}
