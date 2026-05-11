package com.flowboard.auth.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.flowboard.auth.config.JwtUtil;
import com.flowboard.auth.exception.CustomException;
import com.flowboard.auth.model.User;
import com.flowboard.auth.model.Role;
import com.flowboard.auth.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private JwtUtil jwtUtil = new JwtUtil();

    @InjectMocks
    private AuthServiceImpl authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        org.springframework.test.util.ReflectionTestUtils.setField(jwtUtil, "jwtSecret", "testSecrettestSecrettestSecrettestSecrettestSecret");
        org.springframework.test.util.ReflectionTestUtils.setField(jwtUtil, "tokenExpiry", 3600000L);
        org.springframework.test.util.ReflectionTestUtils.setField(authService, "jwtUtil", jwtUtil);

        testUser = new User();
        testUser.setUserId(1);
        testUser.setEmail("test@example.com");
        testUser.setUserName("testuser");
        testUser.setPasswordHash("encodedPassword");
        testUser.setRole(Role.MEMBER);
        testUser.setIsActive(true);
    }

    @Test
    void register_Success() {
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(userRepository.existsByUserName(any())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("encodedPassword");
        when(userRepository.save(any())).thenReturn(testUser);

        User registered = authService.register(testUser);

        assertNotNull(registered);
        assertEquals(testUser.getEmail(), registered.getEmail());
        verify(userRepository).save(any());
    }

    @Test
    void register_UserAlreadyExists_ThrowsException() {
        when(userRepository.existsByEmail(any())).thenReturn(true);

        CustomException exception = assertThrows(CustomException.class, () -> {
            authService.register(testUser);
        });

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals("User already registered with this email or username", exception.getMessage());
    }

    @Test
    void login_Success() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(any(), any())).thenReturn(true);

        String token = authService.login("test@example.com", "password");

        assertNotNull(token);
    }

    @Test
    void login_UserNotFound_ThrowsException() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());

        CustomException exception = assertThrows(CustomException.class, () -> {
            authService.login("notfound@example.com", "password");
        });

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
    }

    @Test
    void login_WrongPassword_ThrowsException() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(any(), any())).thenReturn(false);

        CustomException exception = assertThrows(CustomException.class, () -> {
            authService.login("test@example.com", "wrongpassword");
        });

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
    }

    @Test
    void validateToken_ValidToken() {
        String token = jwtUtil.generateToken("test@example.com", 1, "MEMBER", "Engineering");
        boolean isValid = authService.validateToken(token);
        assertTrue(isValid);
    }

    @Test
    void logout_BlacklistsToken() {
        authService.logout("someToken");
        
        // validateToken should now return false for this token
        boolean isValid = authService.validateToken("someToken");
        assertFalse(isValid);
    }
}
