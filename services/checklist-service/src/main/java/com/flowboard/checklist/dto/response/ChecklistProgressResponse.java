package com.flowboard.checklist.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChecklistProgressResponse {
    private Long cardId;
    private int totalItems;
    private int completedItems;
    private double progressPercentage;
}
