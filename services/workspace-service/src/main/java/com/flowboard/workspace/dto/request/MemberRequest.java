package com.flowboard.workspace.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberRequest {
    
    @NotNull(message = "User ID is required")
    private Integer userId;

    @NotBlank(message = "Role is required")
    private String role;
}
