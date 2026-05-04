package com.flowboard.board.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardResponse {
    private Long boardId;
    private Long workspaceId;
    private String name;
    private String description;
    private String background;
    private String visibility;
    private Long createdById;
    private boolean closed;
    private LocalDateTime createdAt;
}
