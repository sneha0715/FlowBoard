package com.flowboard.auth.service;

import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.flowboard.auth.config.JwtUtil;
import com.flowboard.auth.model.User;
import com.flowboard.auth.repository.UserRepository;
import com.flowboard.auth.exception.CustomException;
import org.springframework.http.HttpStatus;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // In-memory blacklist for tokens
    private final Set<String> blacklistedTokens = ConcurrentHashMap.newKeySet();

    @Override
    public User register(User user) {
        if (userRepository.existsByEmail(user.getEmail()) || userRepository.existsByUserName(user.getUserName())) {
            User existing = userRepository.findByEmail(user.getEmail()).orElse(null);
            if (existing != null && "PENDING_STUB".equals(existing.getFullName())) {
                existing.setFullName(user.getFullName());
                existing.setUserName(user.getUserName());
                existing.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
                log.info("Stub user registered properly: {}", user.getEmail());
                return userRepository.save(existing);
            }
            log.warn("Register failed — email/username already exists: {}", user.getEmail());
            throw new CustomException("User already registered with this email or username", HttpStatus.CONFLICT);
        }
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        User saved = userRepository.save(user);
        log.info("User registered: id={}, email={}", saved.getUserId(), saved.getEmail());
        return saved;
    }

    @Override
    public String login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("Login failed — user not found: {}", email);
                    return new CustomException("User not found", HttpStatus.NOT_FOUND);
                });

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            log.warn("Login failed — wrong password for: {}", email);
            throw new CustomException("Invalid password", HttpStatus.UNAUTHORIZED);
        }

        if (user.getIsActive() != null && !user.getIsActive()) {
            log.warn("Login failed — account deactivated: {}", email);
            throw new CustomException("Account is deactivated", HttpStatus.FORBIDDEN);
        }

        log.info("User logged in: id={}, email={}", user.getUserId(), email);
        return jwtUtil.generateToken(user.getEmail(), user.getUserId(), user.getRole().name(), "General");
    }

    @Override
    public void logout(String token) {
        if (token != null) {
            blacklistedTokens.add(token);
            log.info("User logged out — token blacklisted");
        }
    }

    @Override
    public boolean validateToken(String token) {
        if (token == null || blacklistedTokens.contains(token)) {
            return false;
        }
        return jwtUtil.isTokenStructurallyValid(token);
    }

    @Override
    public String refreshToken(String token) {
        if (!validateToken(token)) {
            throw new CustomException("Invalid or blacklisted token", HttpStatus.UNAUTHORIZED);
        }
        String email = jwtUtil.extractEmail(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        return jwtUtil.generateToken(user.getEmail(), user.getUserId(), user.getRole().name(), "General");
    }

    @Override
    public User getProfile(String token) {
        if (!validateToken(token)) {
            throw new CustomException("Invalid or blacklisted token", HttpStatus.UNAUTHORIZED);
        }
        String email = jwtUtil.extractEmail(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
        return user;
    }

    @Override
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found with email: " + email, HttpStatus.NOT_FOUND));
    }

    @Override
    public User getUserByUserId(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found with ID: " + userId, HttpStatus.NOT_FOUND));
    }

    @Override
    public User updateProfile(Integer id, User updatedUser) {
        User existingUser = getUserByUserId(id);

        existingUser.setFullName(updatedUser.getFullName());
        existingUser.setAvatarUrl(updatedUser.getAvatarUrl());
        // Do not update email or username here as they are usually unique identifiers

        User saved = userRepository.save(existingUser);
        log.info("Profile updated: userId={}", id);
        return saved;
    }

    @Override
    public void changePassword(Integer id, String newPassword) {
        User user = getUserByUserId(id);
        String encodedPassword = passwordEncoder.encode(newPassword);
        if (encodedPassword == null) {
            throw new CustomException("Failed to encode password", HttpStatus.INTERNAL_SERVER_ERROR);
        }
        user.setPasswordHash(encodedPassword);
        userRepository.save(user);
        log.info("Password changed: userId={}", id);
    }

    @Override
    public void deactivateAccount(Integer id) {
        User user = getUserByUserId(id);
        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new CustomException("User is already deactivated", HttpStatus.CONFLICT);
        }
        user.setIsActive(false);
        userRepository.save(user);
        log.info("Account deactivated: userId={}", id);
    }

    @Override
    public void activateAccount(Integer id) {
        User user = getUserByUserId(id);
        if (Boolean.TRUE.equals(user.getIsActive())) {
            throw new CustomException("User is already active", HttpStatus.CONFLICT);
        }
        user.setIsActive(true);
        userRepository.save(user);
        log.info("Account activated: userId={}", id);
    }

    @Override
    public void deleteAccount(Integer id) {
        User user = getUserByUserId(id);
        userRepository.delete(user);
        log.info("Account deleted: userId={}", id);
    }

    @Override
    public List<User> searchUsers(String query) {
        if (query == null || query.trim().isEmpty()) {
            return userRepository.findAll();
        }
        return userRepository.searchByQuery(query);
    }

    @Override
    public User updateUserRole(Integer userId, String role) {
        User user = getUserByUserId(userId);
        try {
            com.flowboard.auth.model.Role newRole = com.flowboard.auth.model.Role.valueOf(role.toUpperCase());
            user.setRole(newRole);
            User saved = userRepository.save(user);
            log.info("User role updated: userId={}, role={}", userId, role);
            return saved;
        } catch (IllegalArgumentException e) {
            throw new CustomException("Invalid role: " + role, org.springframework.http.HttpStatus.BAD_REQUEST);
        }
    }
}
