package com.flowboard.card.dto.request;

import com.flowboard.card.model.Priority;
import com.flowboard.card.model.Status;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CardRequest {
    @NotNull(message = "List ID is required")
    private Long listId;

    @NotNull(message = "Board ID is required")
    private Long boardId;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    private Integer position;
    private Priority priority;
    private Status status;
    private LocalDate dueDate;
    private LocalDate startDate;
    private Long assigneeId;
    private String coverColor;
}
