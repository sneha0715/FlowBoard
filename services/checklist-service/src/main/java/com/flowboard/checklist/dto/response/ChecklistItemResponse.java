package com.flowboard.checklist.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class ChecklistItemResponse {
    private Long itemId;
    private String text;
    private boolean isCompleted;
    private Long assigneeId;
    private LocalDate dueDate;
}
