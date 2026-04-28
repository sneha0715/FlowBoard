package com.flowboard.checklist.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ChecklistResponse {
    private Long checklistId;
    private Long cardId;
    private String title;
    private int position;
    private List<ChecklistItemResponse> items;
    private LocalDateTime createdAt;
}
