package com.flowboard.card.dto.response;

import com.flowboard.card.model.Priority;
import com.flowboard.card.model.Status;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class CardResponse {
    private Long cardId;
    private Long listId;
    private Long boardId;
    private String title;
    private String description;
    private int position;
    private Priority priority;
    private Status status;
    private LocalDate dueDate;
    private LocalDate startDate;
    private Long assigneeId;
    private Long createdById;
    private boolean archived;
    private String coverColor;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
