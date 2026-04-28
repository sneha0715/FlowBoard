package com.flowboard.checklist.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ChecklistItemRequest {
    @NotBlank(message = "Text is required")
    private String text;

    private Long assigneeId;

    private LocalDate dueDate;
}
