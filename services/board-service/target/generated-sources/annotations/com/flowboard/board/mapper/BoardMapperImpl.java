package com.flowboard.board.mapper;

import com.flowboard.board.dto.request.BoardRequest;
import com.flowboard.board.dto.response.BoardResponse;
import com.flowboard.board.model.Board;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-11T23:37:21+0530",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 20.0.1 (Oracle Corporation)"
)
@Component
public class BoardMapperImpl implements BoardMapper {

    @Override
    public Board toEntity(BoardRequest request) {
        if ( request == null ) {
            return null;
        }

        Board.BoardBuilder board = Board.builder();

        board.workspaceId( request.getWorkspaceId() );
        board.name( request.getName() );
        board.description( request.getDescription() );
        board.background( request.getBackground() );
        board.visibility( request.getVisibility() );

        return board.build();
    }

    @Override
    public BoardResponse toResponse(Board board) {
        if ( board == null ) {
            return null;
        }

        BoardResponse.BoardResponseBuilder boardResponse = BoardResponse.builder();

        boardResponse.boardId( board.getBoardId() );
        boardResponse.workspaceId( board.getWorkspaceId() );
        boardResponse.name( board.getName() );
        boardResponse.description( board.getDescription() );
        boardResponse.background( board.getBackground() );
        boardResponse.visibility( board.getVisibility() );
        boardResponse.createdById( board.getCreatedById() );
        boardResponse.closed( board.isClosed() );
        boardResponse.createdAt( board.getCreatedAt() );

        return boardResponse.build();
    }

    @Override
    public void updateEntityFromRequest(BoardRequest request, Board board) {
        if ( request == null ) {
            return;
        }

        board.setWorkspaceId( request.getWorkspaceId() );
        board.setName( request.getName() );
        board.setDescription( request.getDescription() );
        board.setBackground( request.getBackground() );
        board.setVisibility( request.getVisibility() );
    }
}
