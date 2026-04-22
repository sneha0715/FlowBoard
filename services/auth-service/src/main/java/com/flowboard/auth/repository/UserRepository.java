package com.flowboard.auth.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.flowboard.auth.model.Role;
import com.flowboard.auth.model.User;

import jakarta.transaction.Transactional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);

    Optional<User> findByUserName(String userName);

    User findByUserId(int userId);

    Boolean existsByEmail(String email);

    Boolean existsByUserName(String userName);

    List<User> findAllByRole(Role role);

    @Query("SELECT u FROM User u WHERE LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.userName) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<User> searchByFullName(@Param("query") String query);

    @Transactional
    void deleteByUserId(int userId);

}
