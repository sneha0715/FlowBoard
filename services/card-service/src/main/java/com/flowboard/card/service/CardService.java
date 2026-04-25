package com.flowboard.card.service;

import com.flowboard.card.dto.request.CardRequest;
import com.flowboard.card.dto.response.CardResponse;
import com.flowboard.card.model.Priority;
import com.flowboard.card.model.Status;

import java.util.List;

public interface CardService {
    CardResponse createCard(CardRequest request);
    CardResponse getCardById(Long cardId);
    List<CardResponse> getCardsByList(Long listId);
    List<CardResponse> getCardsByBoard(Long boardId);
    List<CardResponse> getCardsByAssignee(Long assigneeId);
    CardResponse updateCard(Long cardId, CardRequest request);
    CardResponse moveCard(Long cardId, Long newListId, int newPosition);
    void reorderCards(Long listId, List<Long> cardIds);
    void archiveCard(Long cardId);
    void unarchiveCard(Long cardId);
    void deleteCard(Long cardId);
    void setAssignee(Long cardId, Long assigneeId);
    void setPriority(Long cardId, Priority priority);
    void setStatus(Long cardId, Status status);
    List<CardResponse> getOverdueCards();
}
