package com.flowboard.column.repository;

import com.flowboard.column.model.TaskList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ListRepository extends JpaRepository<TaskList, Long> {

    List<TaskList> findByBoardId(Long boardId);

    Optional<TaskList> findByListId(Long listId);

    List<TaskList> findByBoardIdOrderByPosition(Long boardId);

    List<TaskList> findByBoardIdAndIsArchived(Long boardId, boolean isArchived);

    int countByBoardId(Long boardId);

    @Query("SELECT MAX(t.position) FROM TaskList t WHERE t.boardId = :boardId")
    Integer findMaxPositionByBoardId(Long boardId);

    void deleteByListId(Long listId);
}
