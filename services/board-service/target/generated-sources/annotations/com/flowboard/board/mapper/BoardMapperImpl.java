package com.flowboard.board.mapper;

import com.flowboard.board.dto.request.BoardRequest;
import com.flowboard.board.dto.response.BoardResponse;
import com.flowboard.board.model.Board;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-09T00:37:35+0530",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class BoardMapperImpl implements BoardMapper {

    @Override
    public Board toEntity(BoardRequest request) {
        if ( request == null ) {
            return null;
        }

        Board.BoardBuilder board = Board.builder();

        board.background( request.getBackground() );
        board.description( request.getDescription() );
        board.name( request.getName() );
        board.visibility( request.getVisibility() );
        board.workspaceId( request.getWorkspaceId() );

        return board.build();
    }

    @Override
    public BoardResponse toResponse(Board board) {
        if ( board == null ) {
            return null;
        }

        BoardResponse.BoardResponseBuilder boardResponse = BoardResponse.builder();

        boardResponse.background( board.getBackground() );
        boardResponse.boardId( board.getBoardId() );
        boardResponse.closed( board.isClosed() );
        boardResponse.createdAt( board.getCreatedAt() );
        boardResponse.createdById( board.getCreatedById() );
        boardResponse.description( board.getDescription() );
        boardResponse.name( board.getName() );
        boardResponse.visibility( board.getVisibility() );
        boardResponse.workspaceId( board.getWorkspaceId() );

        return boardResponse.build();
    }

    @Override
    public void updateEntityFromRequest(BoardRequest request, Board board) {
        if ( request == null ) {
            return;
        }

        board.setBackground( request.getBackground() );
        board.setDescription( request.getDescription() );
        board.setName( request.getName() );
        board.setVisibility( request.getVisibility() );
        board.setWorkspaceId( request.getWorkspaceId() );
    }
}
