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

    User getUserByUserId(Integer userId);

    User getProfile(String token);

    User updateProfile(Integer id , User user);

    void changePassword(Integer id, String newPassword);
    
    void deactivateAccount(Integer id);
    
    void activateAccount(Integer id);
    
    void deleteAccount(Integer id);
    
    List<User> searchUsers(String query);

    User updateUserRole(Integer userId, String role);

}
