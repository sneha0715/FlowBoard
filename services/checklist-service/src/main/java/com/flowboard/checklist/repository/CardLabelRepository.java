package com.flowboard.checklist.repository;

import com.flowboard.checklist.entity.CardLabel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CardLabelRepository extends JpaRepository<CardLabel, Long> {
    List<CardLabel> findByCardId(Long cardId);
    Optional<CardLabel> findByCardIdAndLabelId(Long cardId, Long labelId);
    void deleteByCardIdAndLabelId(Long cardId, Long labelId);
    void deleteByLabelId(Long labelId);
}
