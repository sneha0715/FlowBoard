package com.flowboard.comment.mapper;

import com.flowboard.comment.dto.request.AttachmentRequest;
import com.flowboard.comment.dto.response.AttachmentResponse;
import com.flowboard.comment.entity.Attachment;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-17T17:07:15+0530",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 20.0.1 (Oracle Corporation)"
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
        attachment.fileUrl( request.getFileUrl() );
        attachment.fileType( request.getFileType() );
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
        attachmentResponse.uploaderId( attachment.getUploaderId() );
        attachmentResponse.fileName( attachment.getFileName() );
        attachmentResponse.fileUrl( attachment.getFileUrl() );
        attachmentResponse.fileType( attachment.getFileType() );
        attachmentResponse.sizeKb( attachment.getSizeKb() );
        attachmentResponse.uploadedAt( attachment.getUploadedAt() );

        return attachmentResponse.build();
    }
}
