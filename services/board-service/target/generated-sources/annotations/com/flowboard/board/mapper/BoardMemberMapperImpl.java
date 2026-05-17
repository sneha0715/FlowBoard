package com.flowboard.board.mapper;

import com.flowboard.board.dto.request.BoardMemberRequest;
import com.flowboard.board.dto.response.BoardMemberResponse;
import com.flowboard.board.model.BoardMember;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-17T17:06:25+0530",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 20.0.1 (Oracle Corporation)"
)
@Component
public class BoardMemberMapperImpl implements BoardMemberMapper {

    @Override
    public BoardMember toEntity(BoardMemberRequest request) {
        if ( request == null ) {
            return null;
        }

        BoardMember.BoardMemberBuilder boardMember = BoardMember.builder();

        boardMember.userId( request.getUserId() );
        boardMember.role( request.getRole() );

        return boardMember.build();
    }

    @Override
    public BoardMemberResponse toResponse(BoardMember boardMember) {
        if ( boardMember == null ) {
            return null;
        }

        BoardMemberResponse.BoardMemberResponseBuilder boardMemberResponse = BoardMemberResponse.builder();

        boardMemberResponse.boardMemberId( boardMember.getBoardMemberId() );
        boardMemberResponse.boardId( boardMember.getBoardId() );
        boardMemberResponse.userId( boardMember.getUserId() );
        boardMemberResponse.role( boardMember.getRole() );
        boardMemberResponse.addedAt( boardMember.getAddedAt() );

        return boardMemberResponse.build();
    }

    @Override
    public void updateEntityFromRequest(BoardMemberRequest request, BoardMember boardMember) {
        if ( request == null ) {
            return;
        }

        boardMember.setUserId( request.getUserId() );
        boardMember.setRole( request.getRole() );
    }
}
