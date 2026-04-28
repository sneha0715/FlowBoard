package com.flowboard.checklist.repository;

import com.flowboard.checklist.entity.Label;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LabelRepository extends JpaRepository<Label, Long> {
    List<Label> findByBoardId(Long boardId);
}
