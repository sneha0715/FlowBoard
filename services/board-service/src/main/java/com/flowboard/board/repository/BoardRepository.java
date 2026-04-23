package com.flowboard.board.repository;

import com.flowboard.board.model.Board;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BoardRepository extends JpaRepository<Board, Long> {

    List<Board> findByWorkspaceId(Long workspaceId);

    Optional<Board> findByBoardId(Long boardId);

    List<Board> findByCreatedById(Long createdById);

    @Query("SELECT b FROM Board b JOIN BoardMember bm ON b.boardId = bm.boardId WHERE bm.userId = :userId")
    List<Board> findByMemberUserId(@Param("userId") Long userId);

    List<Board> findByVisibility(String visibility);

    long countByWorkspaceId(Long workspaceId);

    List<Board> findByIsClosed(boolean isClosed);
}
