package com.flowboard.auth.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.flowboard.auth.dto.request.LoginRequest;
import com.flowboard.auth.dto.request.RegisterRequest;
import com.flowboard.auth.dto.response.ApiResponse;
import com.flowboard.auth.dto.response.LoginResponse;
import com.flowboard.auth.dto.response.UserResponse;
import com.flowboard.auth.mapper.UserMapper;
import com.flowboard.auth.model.User;
import com.flowboard.auth.service.AuthService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;
    private final UserMapper userMapper;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(@RequestBody RegisterRequest registerRequest) {
        User newUser = userMapper.toEntity(registerRequest);
        User savedUser = authService.register(newUser);
        UserResponse userResponse = userMapper.toResponse(savedUser);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(userResponse, "User registered successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody LoginRequest loginRequest) {
        String token = authService.login(loginRequest.getEmail(), loginRequest.getPassword());
        LoginResponse loginResponse = LoginResponse.builder()
                .token(token)
                .build();
        return ResponseEntity.ok(ApiResponse.success(loginResponse, "Login successful"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestHeader("Authorization") String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            authService.logout(authHeader.substring(7));
        }
        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(null, "Logout successful"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refresh(@RequestHeader("Authorization") String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String refreshToken = authHeader.substring(7);
            String newToken = authService.refreshToken(refreshToken);
            LoginResponse loginResponse = LoginResponse.builder()
                    .token(newToken)
                    .build();
            return ResponseEntity.ok(ApiResponse.success(loginResponse, "Token refreshed successfully"));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Unauthorized: Invalid or missing token", "/auth/refresh"));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> getProfile(@RequestHeader("Authorization") String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            User user = authService.getProfile(token);
            UserResponse userResponse = userMapper.toResponse(user);
            return ResponseEntity.ok(ApiResponse.success(userResponse, "Profile fetched successfully"));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Unauthorized: Invalid or missing token", "/auth/profile"));
    }

    @PutMapping("/profile/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(@RequestHeader("Authorization") String authHeader,
            @PathVariable Integer id, @RequestBody User updatedUser) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            User user = authService.updateProfile(id, updatedUser);
            UserResponse userResponse = userMapper.toResponse(user);
            return ResponseEntity.ok(ApiResponse.success(userResponse, "Profile updated successfully"));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Unauthorized: Invalid or missing token",
                        "/auth/profile/" + id));
    }

    @PostMapping("/change-password/{id}")
    public ResponseEntity<ApiResponse<Void>> changePassword(@RequestHeader("Authorization") String authHeader,
            @PathVariable Integer id, @RequestBody Map<String, String> request) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            // In a real scenario, you'd check if the user is an admin or is changing their
            // own password
            String newPassword = request.get("newPassword");
            if (newPassword == null || newPassword.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Missing required field: newPassword", "/auth/change-password/" + id));
            }
            authService.changePassword(id, newPassword);
            return ResponseEntity.ok(ApiResponse.success(null, "Password changed successfully"));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Unauthorized: Invalid or missing token", "/auth/change-password/" + id));
    }

    @GetMapping("/users/search")
    public ResponseEntity<ApiResponse<List<UserResponse>>> searchUsers(
            @RequestParam(value = "query", required = false) String query) {
        List<User> users = authService.searchUsers(query);
        List<UserResponse> userResponses = users.stream()
                .map(userMapper::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(userResponses, "Users fetched successfully"));
    }

    @PostMapping("/deactivate/{id}")
    public ResponseEntity<ApiResponse<Void>> deactivateAccount(@RequestHeader("Authorization") String authHeader,
            @PathVariable Integer id) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            User user = authService.getProfile(token);
            authService.deactivateAccount(user.getUserId());
            return ResponseEntity.ok(ApiResponse.success(null, "Account deactivated successfully"));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Unauthorized: Invalid or missing token", "/auth/deactivate/" + id));
    }
}
