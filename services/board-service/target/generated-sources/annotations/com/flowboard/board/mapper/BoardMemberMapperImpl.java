package com.flowboard.board.mapper;

import com.flowboard.board.dto.request.BoardMemberRequest;
import com.flowboard.board.dto.response.BoardMemberResponse;
import com.flowboard.board.model.BoardMember;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-06T16:14:22+0530",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class BoardMemberMapperImpl implements BoardMemberMapper {

    @Override
    public BoardMember toEntity(BoardMemberRequest request) {
        if ( request == null ) {
            return null;
        }

        BoardMember.BoardMemberBuilder boardMember = BoardMember.builder();

        boardMember.role( request.getRole() );
        boardMember.userId( request.getUserId() );

        return boardMember.build();
    }

    @Override
    public BoardMemberResponse toResponse(BoardMember boardMember) {
        if ( boardMember == null ) {
            return null;
        }

        BoardMemberResponse.BoardMemberResponseBuilder boardMemberResponse = BoardMemberResponse.builder();

        boardMemberResponse.addedAt( boardMember.getAddedAt() );
        boardMemberResponse.boardId( boardMember.getBoardId() );
        boardMemberResponse.boardMemberId( boardMember.getBoardMemberId() );
        boardMemberResponse.role( boardMember.getRole() );
        boardMemberResponse.userId( boardMember.getUserId() );

        return boardMemberResponse.build();
    }

    @Override
    public void updateEntityFromRequest(BoardMemberRequest request, BoardMember boardMember) {
        if ( request == null ) {
            return;
        }

        boardMember.setRole( request.getRole() );
        boardMember.setUserId( request.getUserId() );
    }
}
