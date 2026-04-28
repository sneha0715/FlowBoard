package com.flowboard.comment.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.flowboard.comment.dto.request.CommentRequest;
import com.flowboard.comment.dto.response.CommentResponse;
import com.flowboard.comment.entity.Comment;

@Mapper(componentModel = "spring")
public interface CommentMapper {

    @Mapping(target = "commentId", ignore = true)
    @Mapping(target = "authorId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    Comment toEntity(CommentRequest request);

    CommentResponse toResponse(Comment comment);
}
