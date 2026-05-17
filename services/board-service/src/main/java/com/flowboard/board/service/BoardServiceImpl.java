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
    private final com.flowboard.board.client.WorkspaceClient workspaceClient;

    @org.springframework.beans.factory.annotation.Value("${gateway.secret}")
    private String gatewaySecret;

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
    public List<BoardResponse> getBoardsByWorkspace(Long workspaceId, Long userId) {
        List<Board> boards = boardRepository.findByWorkspaceId(workspaceId);
        
        if (userId == null) {
            // Guest user: only see public boards
            return boards.stream()
                    .filter(b -> "PUBLIC".equalsIgnoreCase(b.getVisibility()))
                    .map(boardMapper::toResponse)
                    .collect(Collectors.toList());
        }
        
        // Check if workspace member
        try {
            java.util.Map<String, String> result = workspaceClient.getMemberRole(
                    workspaceId.intValue(), userId.intValue(), gatewaySecret);
            String role = result != null ? result.get("role") : "NONE";
            
            if ("NONE".equalsIgnoreCase(role)) {
                // Not a member, only see public boards
                return boards.stream()
                        .filter(b -> "PUBLIC".equalsIgnoreCase(b.getVisibility()))
                        .map(boardMapper::toResponse)
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            log.error("Failed to check workspace role for userId={} in workspace={}", userId, workspaceId, e);
            // Fallback to only public boards if error
            return boards.stream()
                    .filter(b -> "PUBLIC".equalsIgnoreCase(b.getVisibility()))
                    .map(boardMapper::toResponse)
                    .collect(Collectors.toList());
        }
        
        // Is a member, see all boards
        return boards.stream()
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
    public List<BoardResponse> getAllBoards() {
        return boardRepository.findAll().stream()
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
        // 1. Direct board membership
        if (boardMemberRepository.existsByBoardIdAndUserId(boardId, userId)) {
            return true;
        }
        // 2. Workspace-level fallback: any workspace role grants board access
        return boardRepository.findById(boardId).map(board -> {
            if (board.getWorkspaceId() == null) return false;
            try {
                java.util.Map<String, String> result = workspaceClient.getMemberRole(
                        board.getWorkspaceId().intValue(), userId.intValue(), gatewaySecret);
                String role = result != null ? result.get("role") : null;
                return role != null && !role.equalsIgnoreCase("NONE");
            } catch (Exception e) {
                log.error("Workspace role check failed for boardId={}, userId={}", boardId, userId, e);
                return false;
            }
        }).orElse(false);
    }

    @Override
    public String getRole(Long boardId, Long userId) {
        // 1. Check explicit board-level role first
        String boardRole = boardMemberRepository.findByBoardIdAndUserId(boardId, userId)
                .map(BoardMember::getRole)
                .orElse(null);
        if (boardRole != null) return boardRole;

        // 2. Fall back to workspace-level role
        return boardRepository.findById(boardId).map(board -> {
            if (board.getWorkspaceId() == null) return "NONE";
            try {
                java.util.Map<String, String> result = workspaceClient.getMemberRole(
                        board.getWorkspaceId().intValue(), userId.intValue(), gatewaySecret);
                String wsRole = result != null ? result.get("role") : null;
                // Map workspace roles to board roles
                if ("OWNER".equalsIgnoreCase(wsRole) || "ADMIN".equalsIgnoreCase(wsRole)) return "ADMIN";
                if ("MEMBER".equalsIgnoreCase(wsRole)) return "MEMBER";
                return "NONE";
            } catch (Exception e) {
                return "NONE";
            }
        }).orElse("NONE");
    }
}
