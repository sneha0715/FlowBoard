package com.flowboard.auth.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.flowboard.auth.model.User;

import jakarta.transaction.Transactional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);

    Optional<User> findByUserName(String userName);

    User findByUserId(int userId);

    Boolean existsByEmail(String email);

    Boolean existsByUserName(String userName);

    List<User> findAllByRole(String role);

    List<User> searchByFullName(String fullName);

    @Transactional
    void deleteByUserId(int userId);

}
