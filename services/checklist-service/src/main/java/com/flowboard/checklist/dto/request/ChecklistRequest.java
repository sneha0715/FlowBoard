package com.flowboard.checklist.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChecklistRequest {
    @NotNull(message = "Card ID is required")
    private Long cardId;

    @NotBlank(message = "Title is required")
    private String title;

    private int position;
}
