package com.flowboard.board.service;

import com.flowboard.board.dto.request.BoardMemberRequest;
import com.flowboard.board.dto.request.BoardRequest;
import com.flowboard.board.dto.response.BoardMemberResponse;
import com.flowboard.board.dto.response.BoardResponse;
import com.flowboard.board.exception.ResourceNotFoundException;
import com.flowboard.board.mapper.BoardMapper;
import com.flowboard.board.mapper.BoardMemberMapper;
import com.flowboard.board.model.Board;
import com.flowboard.board.model.BoardMember;
import com.flowboard.board.repository.BoardMemberRepository;
import com.flowboard.board.repository.BoardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BoardServiceImpl implements BoardService {

    private final BoardRepository boardRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final BoardMapper boardMapper;
    private final BoardMemberMapper boardMemberMapper;

    @Override
    @Transactional
    public BoardResponse createBoard(BoardRequest request, Long userId) {
        Board board = boardMapper.toEntity(request);
        board.setCreatedById(userId);
        Board savedBoard = boardRepository.save(board);

        BoardMember member = BoardMember.builder()
                .boardId(savedBoard.getBoardId())
                .userId(userId)
                .role("ADMIN")
                .build();
        boardMemberRepository.save(member);

        log.info("Board created: id={}, name={}, userId={}", savedBoard.getBoardId(), savedBoard.getName(), userId);
        return boardMapper.toResponse(savedBoard);
    }

    @Override
    public BoardResponse getBoardById(Long boardId) {
        return boardRepository.findById(boardId)
                .map(boardMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Board not found with id: " + boardId));
    }

    @Override
    public List<BoardResponse> getBoardsByWorkspace(Long workspaceId) {
        return boardRepository.findByWorkspaceId(workspaceId).stream()
                .map(boardMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<BoardResponse> getBoardsByMember(Long userId) {
        return boardRepository.findByMemberUserId(userId).stream()
                .map(boardMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BoardResponse updateBoard(Long boardId, BoardRequest request) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board not found with id: " + boardId));
        boardMapper.updateEntityFromRequest(request, board);
        BoardResponse response = boardMapper.toResponse(boardRepository.save(board));
        log.info("Board updated: id={}", boardId);
        return response;
    }

    @Override
    @Transactional
    public void closeBoard(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board not found with id: " + boardId));
        board.setClosed(true);
        boardRepository.save(board);
        log.info("Board closed: id={}", boardId);
    }

    @Override
    @Transactional
    public void deleteBoard(Long boardId) {
        if (!boardRepository.existsById(boardId)) {
            throw new ResourceNotFoundException("Board not found with id: " + boardId);
        }
        boardRepository.deleteById(boardId);
        log.info("Board deleted: id={}", boardId);
    }

    @Override
    @Transactional
    public BoardMemberResponse addMember(Long boardId, BoardMemberRequest request) {
        if (boardMemberRepository.existsByBoardIdAndUserId(boardId, request.getUserId())) {
            // Update role if already exists or throw exception
            return updateMemberRole(boardId, request.getUserId(), request.getRole());
        }

        BoardMember member = boardMemberMapper.toEntity(request);
        member.setBoardId(boardId);
        return boardMemberMapper.toResponse(boardMemberRepository.save(member));
    }

    @Override
    @Transactional
    public void removeMember(Long boardId, Long userId) {
        boardMemberRepository.deleteByBoardIdAndUserId(boardId, userId);
        log.info("Board member removed: boardId={}, userId={}", boardId, userId);
    }

    @Override
    @Transactional
    public BoardMemberResponse updateMemberRole(Long boardId, Long userId, String role) {
        BoardMember member = boardMemberRepository.findByBoardIdAndUserId(boardId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in this board"));
        member.setRole(role);
        return boardMemberMapper.toResponse(boardMemberRepository.save(member));
    }

    @Override
    public List<BoardMemberResponse> getMembers(Long boardId) {
        return boardMemberRepository.findByBoardId(boardId).stream()
                .map(boardMemberMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public boolean isMember(Long boardId, Long userId) {
        return boardMemberRepository.existsByBoardIdAndUserId(boardId, userId);
    }

    @Override
    public String getRole(Long boardId, Long userId) {
        return boardMemberRepository.findByBoardIdAndUserId(boardId, userId)
                .map(BoardMember::getRole)
                .orElse("NONE");
    }
}
