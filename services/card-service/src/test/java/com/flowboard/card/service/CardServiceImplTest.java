package com.flowboard.card.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.flowboard.card.dto.request.CardRequest;
import com.flowboard.card.dto.response.CardResponse;
import com.flowboard.card.entity.Card;
import com.flowboard.card.exception.ResourceNotFoundException;
import com.flowboard.card.mapper.CardMapper;
import com.flowboard.card.repository.CardRepository;

@ExtendWith(MockitoExtension.class)
class CardServiceImplTest {

    @Mock
    private CardRepository cardRepository;
    @Mock
    private CardMapper cardMapper;

    @InjectMocks
    private CardServiceImpl cardService;

    private Card testCard;
    private CardRequest cardRequest;
    private CardResponse cardResponse;

    @BeforeEach
    void setUp() {
        testCard = Card.builder()
                .cardId(1L)
                .title("Test Card")
                .listId(10L)
                .build();

        cardRequest = new CardRequest();
        cardRequest.setTitle("Test Card");
        cardRequest.setListId(10L);

        cardResponse = new CardResponse();
        cardResponse.setCardId(1L);
        cardResponse.setTitle("Test Card");
    }

    @Test
    void createCard_Success() {
        when(cardMapper.toEntity(any())).thenReturn(testCard);
        when(cardRepository.save(any())).thenReturn(testCard);
        when(cardMapper.toResponse(any())).thenReturn(cardResponse);

        CardResponse created = cardService.createCard(cardRequest);

        assertNotNull(created);
        assertEquals("Test Card", created.getTitle());
    }

    @Test
    void getCardById_Success() {
        when(cardRepository.findById(1L)).thenReturn(Optional.of(testCard));
        when(cardMapper.toResponse(testCard)).thenReturn(cardResponse);

        CardResponse found = cardService.getCardById(1L);

        assertNotNull(found);
        assertEquals(1L, found.getCardId());
    }
}
