package com.flowboard.workspace.mapper;

import com.flowboard.workspace.dto.request.WorkspaceRequest;
import com.flowboard.workspace.dto.response.WorkspaceMemberResponse;
import com.flowboard.workspace.dto.response.WorkspaceResponse;
import com.flowboard.workspace.model.Workspace;
import com.flowboard.workspace.model.WorkspaceMember;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-17T02:57:09+0530",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 20.0.1 (Oracle Corporation)"
)
@Component
public class WorkspaceMapperImpl implements WorkspaceMapper {

    @Autowired
    private WorkspaceMemberMapper workspaceMemberMapper;

    @Override
    public Workspace toEntity(WorkspaceRequest request) {
        if ( request == null ) {
            return null;
        }

        Workspace.WorkspaceBuilder workspace = Workspace.builder();

        if ( request.getName() != null ) {
            workspace.name( request.getName() );
        }
        if ( request.getDescription() != null ) {
            workspace.description( request.getDescription() );
        }
        if ( request.getOwnerId() != null ) {
            workspace.ownerId( request.getOwnerId() );
        }
        if ( request.getVisibility() != null ) {
            workspace.visibility( request.getVisibility() );
        }
        if ( request.getLogoUrl() != null ) {
            workspace.logoUrl( request.getLogoUrl() );
        }

        return workspace.build();
    }

    @Override
    public WorkspaceResponse toResponse(Workspace entity) {
        if ( entity == null ) {
            return null;
        }

        WorkspaceResponse.WorkspaceResponseBuilder workspaceResponse = WorkspaceResponse.builder();

        if ( entity.getWorkspaceId() != null ) {
            workspaceResponse.workspaceId( entity.getWorkspaceId() );
        }
        if ( entity.getName() != null ) {
            workspaceResponse.name( entity.getName() );
        }
        if ( entity.getDescription() != null ) {
            workspaceResponse.description( entity.getDescription() );
        }
        if ( entity.getOwnerId() != null ) {
            workspaceResponse.ownerId( entity.getOwnerId() );
        }
        if ( entity.getVisibility() != null ) {
            workspaceResponse.visibility( entity.getVisibility() );
        }
        if ( entity.getLogoUrl() != null ) {
            workspaceResponse.logoUrl( entity.getLogoUrl() );
        }
        if ( entity.getCreateAt() != null ) {
            workspaceResponse.createAt( entity.getCreateAt() );
        }
        if ( entity.getUpdateAt() != null ) {
            workspaceResponse.updateAt( entity.getUpdateAt() );
        }
        List<WorkspaceMemberResponse> list = workspaceMemberListToWorkspaceMemberResponseList( entity.getMembers() );
        if ( list != null ) {
            workspaceResponse.members( list );
        }

        return workspaceResponse.build();
    }

    protected List<WorkspaceMemberResponse> workspaceMemberListToWorkspaceMemberResponseList(List<WorkspaceMember> list) {
        if ( list == null ) {
            return null;
        }

        List<WorkspaceMemberResponse> list1 = new ArrayList<WorkspaceMemberResponse>( list.size() );
        for ( WorkspaceMember workspaceMember : list ) {
            list1.add( workspaceMemberMapper.toResponse( workspaceMember ) );
        }

        return list1;
    }
}
