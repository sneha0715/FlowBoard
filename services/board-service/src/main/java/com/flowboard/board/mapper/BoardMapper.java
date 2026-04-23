package com.flowboard.board.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import com.flowboard.board.dto.request.BoardRequest;
import com.flowboard.board.dto.response.BoardResponse;
import com.flowboard.board.model.Board;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface BoardMapper {

    Board toEntity(BoardRequest request);

    BoardResponse toResponse(Board board);

    void updateEntityFromRequest(BoardRequest request, @MappingTarget Board board);
}
