package com.flowboard.checklist.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LabelRequest {
    @NotNull(message = "Board ID is required")
    private Long boardId;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Color is required")
    private String color;
}
