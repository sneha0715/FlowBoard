package com.flowboard.checklist.repository;

import com.flowboard.checklist.entity.Checklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChecklistRepository extends JpaRepository<Checklist, Long> {
    List<Checklist> findByCardIdOrderByPositionAsc(Long cardId);
}
