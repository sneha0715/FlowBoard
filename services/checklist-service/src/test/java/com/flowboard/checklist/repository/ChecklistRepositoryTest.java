package com.flowboard.checklist.repository;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import com.flowboard.checklist.entity.Checklist;

@DataJpaTest
@org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase(replace = org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class ChecklistRepositoryTest {

    @Autowired
    private ChecklistRepository checklistRepository;

    @Test
    void findByCardId_ReturnsChecklists() {
        Checklist checklist = Checklist.builder()
                .cardId(1L)
                .title("Tasks")
                .position(1)
                .build();
        checklistRepository.save(checklist);

        List<Checklist> checklists = checklistRepository.findByCardIdOrderByPositionAsc(1L);

        assertFalse(checklists.isEmpty());
        assertEquals("Tasks", checklists.get(0).getTitle());
    }
}

