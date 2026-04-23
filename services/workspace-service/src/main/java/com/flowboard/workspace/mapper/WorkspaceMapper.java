package com.flowboard.workspace.mapper;

import com.flowboard.workspace.dto.request.WorkspaceRequest;
import com.flowboard.workspace.dto.response.WorkspaceResponse;
import com.flowboard.workspace.model.Workspace;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValueCheckStrategy;

@Mapper(componentModel = "spring", nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS, uses = {
        WorkspaceMemberMapper.class })
public interface WorkspaceMapper {

    @Mapping(target = "workspaceId", ignore = true)
    @Mapping(target = "createAt", ignore = true)
    @Mapping(target = "updateAt", ignore = true)
    @Mapping(target = "members", ignore = true)
    Workspace toEntity(WorkspaceRequest request);

    @Mapping(target = "createAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    @Mapping(target = "updateAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    WorkspaceResponse toResponse(Workspace entity);
}
