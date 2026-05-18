package com.creaditn.creaditnbackend.repository;

import com.creaditn.creaditnbackend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    Boolean existsByEmailIgnoreCase(String email);
    Optional<User> findByPhone(String phone);
}
