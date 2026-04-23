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
public class WorkspaceRequest {

    @NotBlank(message = "Workspace name is required")
    private String name;

    private String description;

    private Integer ownerId;

    private String visibility;

    private String logoUrl;
}
