package com.flowboard.workspace.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.flowboard.workspace.model.Workspace;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, Integer> {
    List<Workspace> findByOwnerId(int ownerId);

    Optional<Workspace> findByWorkspaceId(int workspaceId);

    List<Workspace> findByMembersUserId(int userId);

    List<Workspace> findByVisibility(String visibility);

    boolean existsByNameAndOwnerId(String name , int ownerId);

    int countByOwnerId(int ownerId);

}
