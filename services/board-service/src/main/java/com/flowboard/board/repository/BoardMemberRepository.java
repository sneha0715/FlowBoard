package com.flowboard.board.repository;

import com.flowboard.board.model.BoardMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BoardMemberRepository extends JpaRepository<BoardMember, Long> {

    List<BoardMember> findByBoardId(Long boardId);

    Optional<BoardMember> findByBoardIdAndUserId(Long boardId, Long userId);

    void deleteByBoardIdAndUserId(Long boardId, Long userId);

    boolean existsByBoardIdAndUserId(Long boardId, Long userId);
}
