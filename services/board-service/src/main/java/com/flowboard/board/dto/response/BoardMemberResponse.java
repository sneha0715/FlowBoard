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
public class BoardMemberResponse {
    private Long boardMemberId;
    private Long boardId;
    private Long userId;
    private String role;
    private LocalDateTime addedAt;
}
