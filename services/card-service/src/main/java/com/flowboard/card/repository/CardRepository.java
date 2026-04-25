package com.flowboard.card.repository;

import com.flowboard.card.entity.Card;
import com.flowboard.card.model.Priority;
import com.flowboard.card.model.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CardRepository extends JpaRepository<Card, Long> {
    List<Card> findByListId(Long listId);
    List<Card> findByBoardId(Long boardId);
    List<Card> findByAssigneeId(Long assigneeId);
    List<Card> findByListIdOrderByPosition(Long listId);
    List<Card> findByDueDateBeforeAndStatusNotAndArchivedFalse(LocalDate date, Status status);
    List<Card> findByPriority(Priority priority);
    List<Card> findByStatus(Status status);
    int countByListId(Long listId);
}
