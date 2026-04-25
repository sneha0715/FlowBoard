package com.flowboard.card.service;

import com.flowboard.card.dto.request.CardRequest;
import com.flowboard.card.dto.response.CardResponse;
import com.flowboard.card.entity.Card;
import com.flowboard.card.exception.ResourceNotFoundException;
import com.flowboard.card.mapper.CardMapper;
import com.flowboard.card.model.Priority;
import com.flowboard.card.model.Status;
import com.flowboard.card.repository.CardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CardServiceImpl implements CardService {

    private final CardRepository cardRepository;
    private final CardMapper cardMapper;

    @Override
    @Transactional
    public CardResponse createCard(CardRequest request) {
        Card card = cardMapper.toEntity(request);
        
        // If position is not provided, put it at the end
        if (request.getPosition() == null) {
            int count = cardRepository.countByListId(request.getListId());
            card.setPosition(count);
        }
        
        // Default status and priority if not provided
        if (card.getStatus() == null) card.setStatus(Status.TO_DO);
        if (card.getPriority() == null) card.setPriority(Priority.MEDIUM);
        
        Card savedCard = cardRepository.save(card);
        return cardMapper.toResponse(savedCard);
    }

    @Override
    public CardResponse getCardById(Long cardId) {
        return cardRepository.findById(cardId)
                .map(cardMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found with id: " + cardId));
    }

    @Override
    public List<CardResponse> getCardsByList(Long listId) {
        return cardRepository.findByListIdOrderByPosition(listId).stream()
                .filter(card -> !card.isArchived())
                .map(cardMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<CardResponse> getCardsByBoard(Long boardId) {
        return cardRepository.findByBoardId(boardId).stream()
                .filter(card -> !card.isArchived())
                .map(cardMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<CardResponse> getCardsByAssignee(Long assigneeId) {
        return cardRepository.findByAssigneeId(assigneeId).stream()
                .filter(card -> !card.isArchived())
                .map(cardMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CardResponse updateCard(Long cardId, CardRequest request) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found with id: " + cardId));
        
        cardMapper.updateEntityFromRequest(request, card);
        Card savedCard = cardRepository.save(card);
        return cardMapper.toResponse(savedCard);
    }

    @Override
    @Transactional
    public CardResponse moveCard(Long cardId, Long newListId, int newPosition) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found with id: " + cardId));
        
        Long oldListId = card.getListId();
        int oldPosition = card.getPosition();
        
        if (oldListId.equals(newListId)) {
            // Reordering in the same list
            reorderInSameList(oldListId, card, oldPosition, newPosition);
        } else {
            // Moving to a different list
            shiftPositionsDown(oldListId, oldPosition + 1);
            shiftPositionsUp(newListId, newPosition);
            card.setListId(newListId);
            card.setPosition(newPosition);
        }
        
        return cardMapper.toResponse(cardRepository.save(card));
    }

    private void reorderInSameList(Long listId, Card card, int oldPos, int newPos) {
        List<Card> cards = cardRepository.findByListIdOrderByPosition(listId);
        if (oldPos < newPos) {
            for (Card c : cards) {
                if (c.getPosition() > oldPos && c.getPosition() <= newPos) {
                    c.setPosition(c.getPosition() - 1);
                }
            }
        } else {
            for (Card c : cards) {
                if (c.getPosition() >= newPos && c.getPosition() < oldPos) {
                    c.setPosition(c.getPosition() + 1);
                }
            }
        }
        card.setPosition(newPos);
        cardRepository.saveAll(cards);
    }

    private void shiftPositionsDown(Long listId, int fromPosition) {
        List<Card> cards = cardRepository.findByListIdOrderByPosition(listId);
        for (Card c : cards) {
            if (c.getPosition() >= fromPosition) {
                c.setPosition(c.getPosition() - 1);
            }
        }
        cardRepository.saveAll(cards);
    }

    private void shiftPositionsUp(Long listId, int fromPosition) {
        List<Card> cards = cardRepository.findByListIdOrderByPosition(listId);
        for (Card c : cards) {
            if (c.getPosition() >= fromPosition) {
                c.setPosition(c.getPosition() + 1);
            }
        }
        cardRepository.saveAll(cards);
    }

    @Override
    @Transactional
    public void reorderCards(Long listId, List<Long> cardIds) {
        for (int i = 0; i < cardIds.size(); i++) {
            Long currentCardId = cardIds.get(i);
            Card card = cardRepository.findById(currentCardId)
                    .orElseThrow(() -> new ResourceNotFoundException("Card not found with id: " + currentCardId));
            card.setPosition(i);
            cardRepository.save(card);
        }
    }

    @Override
    @Transactional
    public void archiveCard(Long cardId) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found with id: " + cardId));
        card.setArchived(true);
        cardRepository.save(card);
    }

    @Override
    @Transactional
    public void unarchiveCard(Long cardId) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found with id: " + cardId));
        card.setArchived(false);
        cardRepository.save(card);
    }

    @Override
    @Transactional
    public void deleteCard(Long cardId) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found with id: " + cardId));
        cardRepository.delete(card);
        shiftPositionsDown(card.getListId(), card.getPosition() + 1);
    }

    @Override
    @Transactional
    public void setAssignee(Long cardId, Long assigneeId) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found with id: " + cardId));
        card.setAssigneeId(assigneeId);
        cardRepository.save(card);
    }

    @Override
    @Transactional
    public void setPriority(Long cardId, Priority priority) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found with id: " + cardId));
        card.setPriority(priority);
        cardRepository.save(card);
    }

    @Override
    @Transactional
    public void setStatus(Long cardId, Status status) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found with id: " + cardId));
        card.setStatus(status);
        cardRepository.save(card);
    }

    @Override
    public List<CardResponse> getOverdueCards() {
        return cardRepository.findByDueDateBeforeAndStatusNotAndArchivedFalse(LocalDate.now(), Status.DONE).stream()
                .map(cardMapper::toResponse)
                .collect(Collectors.toList());
    }
}
