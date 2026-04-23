package com.flowboard.workspace.repository;

import com.flowboard.workspace.model.WorkspaceMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, Integer> {
    List<WorkspaceMember> findByWorkspaceWorkspaceId(int workspaceId);
    Optional<WorkspaceMember> findByWorkspaceWorkspaceIdAndUserId(int workspaceId, int userId);
    void deleteByWorkspaceWorkspaceIdAndUserId(int workspaceId, int userId);
}
