package com.flowboard.column.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ListResponse {
    private Long listId;
    private Long boardId;
    private String name;
    private Integer position;
    private String color;
    private boolean isArchived;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
