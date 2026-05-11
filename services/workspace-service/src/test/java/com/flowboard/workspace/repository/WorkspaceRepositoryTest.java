package com.flowboard.workspace.repository;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.flowboard.workspace.config.JpaConfig;
import com.flowboard.workspace.model.Workspace;

@DataJpaTest
@Import(JpaConfig.class)
@AutoConfigureTestDatabase(replace = Replace.NONE)
@ActiveProfiles("test")
class WorkspaceRepositoryTest {

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Test
    void findByOwnerId_ReturnsWorkspaces() {
        Workspace ws = Workspace.builder()
                .name("Owner WS")
                .ownerId(100)
                .build();
        workspaceRepository.save(ws);

        List<Workspace> workspaces = workspaceRepository.findByOwnerId(100);

        assertFalse(workspaces.isEmpty());
        assertEquals("Owner WS", workspaces.get(0).getName());
    }
}

