package com.flowboard.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private Integer userId;
    private String fullName;
    private String email;
    private String userName;
    private com.flowboard.auth.model.Role role;
    private String avatarUrl;
    private String provider;
    private Boolean isActive;
    private LocalDate createdAt;
}
