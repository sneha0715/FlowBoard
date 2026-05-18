package com.flowboard.workspace.mapper;

import com.flowboard.workspace.dto.response.WorkspaceMemberResponse;
import com.flowboard.workspace.model.Workspace;
import com.flowboard.workspace.model.WorkspaceMember;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-18T10:39:46+0530",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class WorkspaceMemberMapperImpl implements WorkspaceMemberMapper {

    @Override
    public WorkspaceMemberResponse toResponse(WorkspaceMember entity) {
        if ( entity == null ) {
            return null;
        }

        WorkspaceMemberResponse.WorkspaceMemberResponseBuilder workspaceMemberResponse = WorkspaceMemberResponse.builder();

        workspaceMemberResponse.workspaceId( entityWorkspaceWorkspaceId( entity ) );
        workspaceMemberResponse.workspaceName( entityWorkspaceName( entity ) );
        workspaceMemberResponse.userId( entity.getUserId() );
        workspaceMemberResponse.role( entity.getRole() );
        workspaceMemberResponse.status( entity.getStatus() );
        workspaceMemberResponse.joinedAt( entity.getJoinedAt() );
        workspaceMemberResponse.memberId( entity.getMemberId() );

        return workspaceMemberResponse.build();
    }

    private Integer entityWorkspaceWorkspaceId(WorkspaceMember workspaceMember) {
        if ( workspaceMember == null ) {
            return null;
        }
        Workspace workspace = workspaceMember.getWorkspace();
        if ( workspace == null ) {
            return null;
        }
        Integer workspaceId = workspace.getWorkspaceId();
        if ( workspaceId == null ) {
            return null;
        }
        return workspaceId;
    }

    private String entityWorkspaceName(WorkspaceMember workspaceMember) {
        if ( workspaceMember == null ) {
            return null;
        }
        Workspace workspace = workspaceMember.getWorkspace();
        if ( workspace == null ) {
            return null;
        }
        String name = workspace.getName();
        if ( name == null ) {
            return null;
        }
        return name;
    }
}
