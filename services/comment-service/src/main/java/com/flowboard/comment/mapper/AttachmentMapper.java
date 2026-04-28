package com.flowboard.comment.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.flowboard.comment.dto.request.AttachmentRequest;
import com.flowboard.comment.dto.response.AttachmentResponse;
import com.flowboard.comment.entity.Attachment;

@Mapper(componentModel = "spring")
public interface AttachmentMapper {

    @Mapping(target = "attachmentId", ignore = true)
    @Mapping(target = "uploaderId", ignore = true)
    @Mapping(target = "uploadedAt", ignore = true)
    Attachment toEntity(AttachmentRequest request);

    AttachmentResponse toResponse(Attachment attachment);
}