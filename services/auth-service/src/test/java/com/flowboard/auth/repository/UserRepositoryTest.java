package com.flowboard.auth.repository;

import static org.junit.jupiter.api.Assertions.*;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import com.flowboard.auth.model.Role;
import com.flowboard.auth.model.User;

@DataJpaTest
@ActiveProfiles("test")
@org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase(replace = org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace.NONE)
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void findByEmail_ReturnsUser() {
        User user = User.builder()
                .fullName("Test User")
                .email("repo@test.com")
                .userName("repo_user")
                .passwordHash("hash")
                .role(Role.MEMBER)
                .build();
        userRepository.save(user);

        Optional<User> found = userRepository.findByEmail("repo@test.com");

        assertTrue(found.isPresent());
        assertEquals("repo_user", found.get().getUserName());
    }

    @Test
    void existsByEmail_ReturnsTrue() {
        User user = User.builder()
                .fullName("Test User")
                .email("exists@test.com")
                .userName("exists_user")
                .passwordHash("hash")
                .build();
        userRepository.save(user);

        boolean exists = userRepository.existsByEmail("exists@test.com");

        assertTrue(exists);
    }
}
