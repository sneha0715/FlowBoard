package com.flowboard.checklist.dto.response;

import lombok.Builder;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistResponse {
    private Long checklistId;
    private Long cardId;
    private String title;
    private int position;
    private List<ChecklistItemResponse> items;
    private LocalDateTime createdAt;
}


