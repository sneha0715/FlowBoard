package com.flowboard.comment.mapper;

import com.flowboard.comment.dto.request.AttachmentRequest;
import com.flowboard.comment.dto.response.AttachmentResponse;
import com.flowboard.comment.entity.Attachment;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-18T10:40:43+0530",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class AttachmentMapperImpl implements AttachmentMapper {

    @Override
    public Attachment toEntity(AttachmentRequest request) {
        if ( request == null ) {
            return null;
        }

        Attachment.AttachmentBuilder attachment = Attachment.builder();

        attachment.cardId( request.getCardId() );
        attachment.fileName( request.getFileName() );
        attachment.fileType( request.getFileType() );
        attachment.fileUrl( request.getFileUrl() );
        attachment.sizeKb( request.getSizeKb() );

        return attachment.build();
    }

    @Override
    public AttachmentResponse toResponse(Attachment attachment) {
        if ( attachment == null ) {
            return null;
        }

        AttachmentResponse.AttachmentResponseBuilder attachmentResponse = AttachmentResponse.builder();

        attachmentResponse.attachmentId( attachment.getAttachmentId() );
        attachmentResponse.cardId( attachment.getCardId() );
        attachmentResponse.fileName( attachment.getFileName() );
        attachmentResponse.fileType( attachment.getFileType() );
        attachmentResponse.fileUrl( attachment.getFileUrl() );
        attachmentResponse.sizeKb( attachment.getSizeKb() );
        attachmentResponse.uploadedAt( attachment.getUploadedAt() );
        attachmentResponse.uploaderId( attachment.getUploaderId() );

        return attachmentResponse.build();
    }
}
