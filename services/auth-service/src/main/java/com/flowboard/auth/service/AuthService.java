package com.flowboard.auth.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.flowboard.auth.model.User;

@Service
public interface AuthService {
    User register(User user);

    String login(String email, String password);

    void logout(String token);  

    boolean validateToken(String token);

    String refreshToken(String token);

    User getUserByEmail(String email);

    User getUserByUserId(int userId);

    User updateProfile(int id , User user);

    void changePassword(int id, String newPassword);
    
    void deactivateAccount(int id);
    
    List<User> getAllUsers();

}
