package com.flowboard.comment.mapper;

import com.flowboard.comment.dto.request.CommentRequest;
import com.flowboard.comment.dto.response.CommentResponse;
import com.flowboard.comment.entity.Comment;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-18T10:40:43+0530",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class CommentMapperImpl implements CommentMapper {

    @Override
    public Comment toEntity(CommentRequest request) {
        if ( request == null ) {
            return null;
        }

        Comment.CommentBuilder comment = Comment.builder();

        comment.cardId( request.getCardId() );
        comment.content( request.getContent() );
        comment.parentCommentId( request.getParentCommentId() );

        return comment.build();
    }

    @Override
    public CommentResponse toResponse(Comment comment) {
        if ( comment == null ) {
            return null;
        }

        CommentResponse.CommentResponseBuilder commentResponse = CommentResponse.builder();

        commentResponse.authorId( comment.getAuthorId() );
        commentResponse.cardId( comment.getCardId() );
        commentResponse.commentId( comment.getCommentId() );
        commentResponse.content( comment.getContent() );
        commentResponse.createdAt( comment.getCreatedAt() );
        commentResponse.parentCommentId( comment.getParentCommentId() );
        commentResponse.updatedAt( comment.getUpdatedAt() );

        return commentResponse.build();
    }
}
