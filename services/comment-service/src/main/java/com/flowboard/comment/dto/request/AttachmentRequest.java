package com.flowboard.comment.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentRequest {

    @NotNull(message = "Card ID is required")
    private Long cardId;

    @NotBlank(message = "File name is required")
    private String fileName;

    @NotBlank(message = "File URL is required")
    private String fileUrl;

    @NotBlank(message = "File type is required")
    private String fileType;

    @NotNull(message = "Size is required")
    private Double sizeKb;
}
