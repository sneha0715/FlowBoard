package com.flowboard.auth.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flowboard.auth.dto.request.RegisterRequest;
import com.flowboard.auth.model.User;

import com.flowboard.auth.service.AuthService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;
    // dto mapper exception logger

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody RegisterRequest registerRequest) {
        User newUser = User.builder().fullName(registerRequest.getFullName()).email(registerRequest.getEmail())
                .userName(registerRequest.getUserName()).passwordHash(registerRequest.getPassword())
                .role(registerRequest.getRole() != null ? registerRequest.getRole() : "MEMBER")
                .provider(registerRequest.getProvider()).isActive(registerRequest.getIsActive() != null ? registerRequest.getIsActive() : true).build();

        User savedUser = authService.register(newUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody User loginRequest) {
        String token = authService.login(loginRequest.getEmail(), loginRequest.getPasswordHash());
        return ResponseEntity.ok(token);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader("Authorization") String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            authService.logout(authHeader.substring(7));
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication()
                .getName();
        User user = authService.getUserByEmail(email);
        return ResponseEntity.ok(user);
    }
}
