package com.flowboard.workspace.mapper;

import com.flowboard.workspace.dto.response.WorkspaceMemberResponse;
import com.flowboard.workspace.model.WorkspaceMember;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface WorkspaceMemberMapper {

    @Mapping(target = "workspaceId", source = "workspace.workspaceId")
    @Mapping(target = "workspaceName", source = "workspace.name")
    @Mapping(target = "userId", source = "userId")
    @Mapping(target = "role", source = "role")
    @Mapping(target = "status", source = "status")
    @Mapping(target = "joinedAt", source = "joinedAt")
    WorkspaceMemberResponse toResponse(WorkspaceMember entity);
}
