package com.flowboard.auth.dto.request;

import com.flowboard.auth.model.Role;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
    private String fullName;
    private String email;
    private String userName;
    private String password;
    private Role role;
    private String provider;
    private Boolean isActive;
}
