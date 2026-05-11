package com.flowboard.checklist.dto.response;

import lombok.Builder;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistProgressResponse {
    private Long cardId;
    private int totalItems;
    private int completedItems;
    private double progressPercentage;
}


