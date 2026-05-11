package com.flowboard.comment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentResponse {
    private Long attachmentId;
    private Long cardId;
    private Long uploaderId;
    private String fileName;
    private String fileUrl;
    private String fileType;
    private Double sizeKb;
    private LocalDateTime uploadedAt;
}

