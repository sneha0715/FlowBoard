package com.flowboard.workspace.mapper;

import com.flowboard.workspace.dto.response.WorkspaceMemberResponse;
import com.flowboard.workspace.model.WorkspaceMember;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface WorkspaceMemberMapper {

    @Mapping(target = "userId", source = "userId")
    @Mapping(target = "role", source = "role")
    @Mapping(target = "joinedAt", source = "joinedAt")
    WorkspaceMemberResponse toResponse(WorkspaceMember entity);
}
