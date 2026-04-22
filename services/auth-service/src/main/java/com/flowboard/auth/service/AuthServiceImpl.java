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
            throw new CustomException("User already registered with this email or username", HttpStatus.CONFLICT);
        }
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        return userRepository.save(user);
    }

    @Override
    public String login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new CustomException("Invalid password", HttpStatus.UNAUTHORIZED);
        }

        if (user.getIsActive() != null && !user.getIsActive()) {
            throw new CustomException("Account is deactivated", HttpStatus.FORBIDDEN);
        }

        return jwtUtil.generateToken(user.getEmail(), user.getUserId(), user.getRole().name(), "General");
    }

    @Override
    public void logout(String token) {
        if (token != null) {
            blacklistedTokens.add(token);
            log.info("Token blacklisted successfully");
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

        return userRepository.save(existingUser);
    }

    @Override
    public void changePassword(Integer id, String newPassword) {
        User user = getUserByUserId(id);
        String encodedPassword = passwordEncoder.encode(newPassword);
        if (encodedPassword == null) {
            throw new CustomException("Failed to encode password", HttpStatus.INTERNAL_SERVER_ERROR);
        }
        user.setPasswordHash(encodedPassword);
        log.info("Updating password for user ID: {}", id);
        userRepository.save(user);
    }

    @Override
    public void deactivateAccount(Integer id) {
        User user = getUserByUserId(id);
        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new CustomException("User is already deactivated", HttpStatus.CONFLICT);
        }
        user.setIsActive(false);
        userRepository.save(user);
    }

    @Override
    public List<User> searchUsers(String query) {
        if (query == null || query.trim().isEmpty()) {
            return userRepository.findAll();
        }
        return userRepository.searchByFullName(query);
    }
}
