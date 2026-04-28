package com.flowboard.checklist.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class LabelResponse {
    private Long labelId;
    private Long boardId;
    private String name;
    private String color;
    private LocalDateTime createdAt;
}
