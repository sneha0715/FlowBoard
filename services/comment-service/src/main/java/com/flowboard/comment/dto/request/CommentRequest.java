package com.flowboard.comment.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentRequest {

    @NotNull(message = "Card ID is required")
    private Long cardId;

    @NotBlank(message = "Comment content is required")
    private String content;

    private Long parentCommentId;
}
