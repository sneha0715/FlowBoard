package com.flowboard.column.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ListRequest {

    @NotNull(message = "Board ID is required")
    private Long boardId;

    @NotBlank(message = "List name is required")
    private String name;

    private Integer position;
    private String color;
}
