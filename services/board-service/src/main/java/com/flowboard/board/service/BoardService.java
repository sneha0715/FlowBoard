package com.flowboard.board.service;

import com.flowboard.board.dto.request.BoardMemberRequest;
import com.flowboard.board.dto.request.BoardRequest;
import com.flowboard.board.dto.response.BoardMemberResponse;
import com.flowboard.board.dto.response.BoardResponse;

import java.util.List;

public interface BoardService {

    BoardResponse createBoard(BoardRequest request, Long userId);

    BoardResponse getBoardById(Long boardId);

    List<BoardResponse> getBoardsByWorkspace(Long workspaceId);

    List<BoardResponse> getBoardsByMember(Long userId);

    BoardResponse updateBoard(Long boardId, BoardRequest request);

    void closeBoard(Long boardId);

    void deleteBoard(Long boardId);

    // Member operations
    BoardMemberResponse addMember(Long boardId, BoardMemberRequest request);

    void removeMember(Long boardId, Long userId);

    BoardMemberResponse updateMemberRole(Long boardId, Long userId, String role);

    List<BoardMemberResponse> getMembers(Long boardId);
}
