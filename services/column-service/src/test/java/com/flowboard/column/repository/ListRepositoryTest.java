package com.flowboard.column.repository;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import com.flowboard.column.model.TaskList;

@DataJpaTest
@org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase(replace = org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class ListRepositoryTest {

    @Autowired
    private ListRepository listRepository;

    @Test
    void findByBoardId_ReturnsLists() {
        TaskList list = TaskList.builder()
                .boardId(1L)
                .name("Todo List")
                .position(1)
                .build();
        listRepository.save(list);

        List<TaskList> lists = listRepository.findByBoardId(1L);

        assertFalse(lists.isEmpty());
        assertEquals("Todo List", lists.get(0).getName());
    }
}

