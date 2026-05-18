package com.flowboard.column.mapper;

import com.flowboard.column.dto.request.ListRequest;
import com.flowboard.column.dto.response.ListResponse;
import com.flowboard.column.model.TaskList;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-18T10:40:08+0530",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class ListMapperImpl implements ListMapper {

    @Override
    public TaskList toEntity(ListRequest request) {
        if ( request == null ) {
            return null;
        }

        TaskList.TaskListBuilder taskList = TaskList.builder();

        taskList.boardId( request.getBoardId() );
        taskList.color( request.getColor() );
        taskList.name( request.getName() );
        taskList.position( request.getPosition() );

        return taskList.build();
    }

    @Override
    public ListResponse toResponse(TaskList taskList) {
        if ( taskList == null ) {
            return null;
        }

        ListResponse.ListResponseBuilder listResponse = ListResponse.builder();

        listResponse.boardId( taskList.getBoardId() );
        listResponse.color( taskList.getColor() );
        listResponse.createdAt( taskList.getCreatedAt() );
        listResponse.listId( taskList.getListId() );
        listResponse.name( taskList.getName() );
        listResponse.position( taskList.getPosition() );
        listResponse.updatedAt( taskList.getUpdatedAt() );

        return listResponse.build();
    }

    @Override
    public void updateEntityFromRequest(ListRequest request, TaskList taskList) {
        if ( request == null ) {
            return;
        }

        taskList.setBoardId( request.getBoardId() );
        taskList.setColor( request.getColor() );
        taskList.setName( request.getName() );
        taskList.setPosition( request.getPosition() );
    }
}
