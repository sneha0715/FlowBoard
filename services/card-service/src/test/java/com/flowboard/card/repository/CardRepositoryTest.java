package com.flowboard.card.repository;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import com.flowboard.card.entity.Card;
import com.flowboard.card.model.Priority;
import com.flowboard.card.model.Status;

@DataJpaTest
@org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase(replace = org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class CardRepositoryTest {

    @Autowired
    private CardRepository cardRepository;

    @Test
    void findByListId_ReturnsCards() {
        Card card = Card.builder()
                .listId(1L)
                .boardId(1L)
                .title("Task Card")
                .position(1)
                .priority(Priority.LOW)
                .status(Status.TO_DO)
                .build();
        cardRepository.save(card);

        List<Card> cards = cardRepository.findByListId(1L);

        assertFalse(cards.isEmpty());
        assertEquals("Task Card", cards.get(0).getTitle());
    }
}

