package com.flowboard.workspace.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkspaceMemberResponse {
    private Integer memberId;
    private Integer workspaceId;
    private String workspaceName;
    private Integer userId;
    private String role;
    private String status;
    private LocalDate joinedAt;
}
