package com.flowboard.board.mapper;

import com.flowboard.board.dto.request.BoardMemberRequest;
import com.flowboard.board.dto.response.BoardMemberResponse;
import com.flowboard.board.model.BoardMember;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface BoardMemberMapper {

    BoardMember toEntity(BoardMemberRequest request);

    BoardMemberResponse toResponse(BoardMember boardMember);

    void updateEntityFromRequest(BoardMemberRequest request, @MappingTarget BoardMember boardMember);
}
