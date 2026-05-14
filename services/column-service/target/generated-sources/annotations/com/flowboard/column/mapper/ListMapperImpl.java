package com.flowboard.column.mapper;

import com.flowboard.column.dto.request.ListRequest;
import com.flowboard.column.dto.response.ListResponse;
import com.flowboard.column.model.TaskList;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-14T23:16:31+0530",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 20.0.1 (Oracle Corporation)"
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
        taskList.name( request.getName() );
        taskList.position( request.getPosition() );
        taskList.color( request.getColor() );

        return taskList.build();
    }

    @Override
    public ListResponse toResponse(TaskList taskList) {
        if ( taskList == null ) {
            return null;
        }

        ListResponse.ListResponseBuilder listResponse = ListResponse.builder();

        listResponse.listId( taskList.getListId() );
        listResponse.boardId( taskList.getBoardId() );
        listResponse.name( taskList.getName() );
        listResponse.position( taskList.getPosition() );
        listResponse.color( taskList.getColor() );
        listResponse.createdAt( taskList.getCreatedAt() );
        listResponse.updatedAt( taskList.getUpdatedAt() );

        return listResponse.build();
    }

    @Override
    public void updateEntityFromRequest(ListRequest request, TaskList taskList) {
        if ( request == null ) {
            return;
        }

        taskList.setBoardId( request.getBoardId() );
        taskList.setName( request.getName() );
        taskList.setPosition( request.getPosition() );
        taskList.setColor( request.getColor() );
    }
}
