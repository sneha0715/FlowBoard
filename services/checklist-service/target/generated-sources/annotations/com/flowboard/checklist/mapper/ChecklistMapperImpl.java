package com.flowboard.checklist.mapper;

import com.flowboard.checklist.dto.request.ChecklistItemRequest;
import com.flowboard.checklist.dto.request.ChecklistRequest;
import com.flowboard.checklist.dto.response.ChecklistItemResponse;
import com.flowboard.checklist.dto.response.ChecklistResponse;
import com.flowboard.checklist.entity.Checklist;
import com.flowboard.checklist.entity.ChecklistItem;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-11T23:38:21+0530",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 20.0.1 (Oracle Corporation)"
)
@Component
public class ChecklistMapperImpl implements ChecklistMapper {

    @Override
    public Checklist toEntity(ChecklistRequest request) {
        if ( request == null ) {
            return null;
        }

        Checklist.ChecklistBuilder checklist = Checklist.builder();

        checklist.cardId( request.getCardId() );
        checklist.title( request.getTitle() );
        checklist.position( request.getPosition() );

        return checklist.build();
    }

    @Override
    public ChecklistResponse toResponse(Checklist checklist) {
        if ( checklist == null ) {
            return null;
        }

        ChecklistResponse.ChecklistResponseBuilder checklistResponse = ChecklistResponse.builder();

        checklistResponse.checklistId( checklist.getChecklistId() );
        checklistResponse.cardId( checklist.getCardId() );
        checklistResponse.title( checklist.getTitle() );
        checklistResponse.position( checklist.getPosition() );
        checklistResponse.items( checklistItemListToChecklistItemResponseList( checklist.getItems() ) );
        checklistResponse.createdAt( checklist.getCreatedAt() );

        return checklistResponse.build();
    }

    @Override
    public ChecklistItem toItemEntity(ChecklistItemRequest request) {
        if ( request == null ) {
            return null;
        }

        ChecklistItem.ChecklistItemBuilder checklistItem = ChecklistItem.builder();

        checklistItem.text( request.getText() );
        checklistItem.assigneeId( request.getAssigneeId() );
        checklistItem.dueDate( request.getDueDate() );

        return checklistItem.build();
    }

    @Override
    public ChecklistItemResponse toItemResponse(ChecklistItem item) {
        if ( item == null ) {
            return null;
        }

        ChecklistItemResponse.ChecklistItemResponseBuilder checklistItemResponse = ChecklistItemResponse.builder();

        checklistItemResponse.isCompleted( item.isCompleted() );
        checklistItemResponse.itemId( item.getItemId() );
        checklistItemResponse.text( item.getText() );
        checklistItemResponse.assigneeId( item.getAssigneeId() );
        checklistItemResponse.dueDate( item.getDueDate() );

        return checklistItemResponse.build();
    }

    @Override
    public void updateEntity(ChecklistRequest request, Checklist checklist) {
        if ( request == null ) {
            return;
        }

        checklist.setTitle( request.getTitle() );
        checklist.setPosition( request.getPosition() );
    }

    @Override
    public void updateItemEntity(ChecklistItemRequest request, ChecklistItem item) {
        if ( request == null ) {
            return;
        }

        item.setText( request.getText() );
        item.setAssigneeId( request.getAssigneeId() );
        item.setDueDate( request.getDueDate() );
    }

    protected List<ChecklistItemResponse> checklistItemListToChecklistItemResponseList(List<ChecklistItem> list) {
        if ( list == null ) {
            return null;
        }

        List<ChecklistItemResponse> list1 = new ArrayList<ChecklistItemResponse>( list.size() );
        for ( ChecklistItem checklistItem : list ) {
            list1.add( toItemResponse( checklistItem ) );
        }

        return list1;
    }
}
