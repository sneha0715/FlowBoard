package com.flowboard.workspace.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkspaceResponse {
    private Integer workspaceId;
    private String name;
    private String description;
    private Integer ownerId;
    private String visibility;
    private String logoUrl;
    private LocalDateTime createAt;
    private LocalDateTime updateAt;
    private List<WorkspaceMemberResponse> members;
}
