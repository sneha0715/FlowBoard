package com.flowboard.comment.repository;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import com.flowboard.comment.entity.Comment;

@DataJpaTest
@org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase(replace = org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class CommentRepositoryTest {

    @Autowired
    private CommentRepository commentRepository;

    @Test
    void findByCardId_ReturnsComments() {
        Comment comment = Comment.builder()
                .cardId(1L)
                .authorId(10L)
                .content("Test Comment")
                .build();
        commentRepository.save(comment);

        List<Comment> comments = commentRepository.findByCardId(1L);

        assertFalse(comments.isEmpty());
        assertEquals("Test Comment", comments.get(0).getContent());
    }
}

