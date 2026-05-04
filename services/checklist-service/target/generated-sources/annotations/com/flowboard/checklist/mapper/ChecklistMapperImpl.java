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
    date = "2026-04-30T23:35:33+0530",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
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
        checklist.position( request.getPosition() );
        checklist.title( request.getTitle() );

        return checklist.build();
    }

    @Override
    public ChecklistResponse toResponse(Checklist checklist) {
        if ( checklist == null ) {
            return null;
        }

        ChecklistResponse.ChecklistResponseBuilder checklistResponse = ChecklistResponse.builder();

        checklistResponse.cardId( checklist.getCardId() );
        checklistResponse.checklistId( checklist.getChecklistId() );
        checklistResponse.createdAt( checklist.getCreatedAt() );
        checklistResponse.items( checklistItemListToChecklistItemResponseList( checklist.getItems() ) );
        checklistResponse.position( checklist.getPosition() );
        checklistResponse.title( checklist.getTitle() );

        return checklistResponse.build();
    }

    @Override
    public ChecklistItem toItemEntity(ChecklistItemRequest request) {
        if ( request == null ) {
            return null;
        }

        ChecklistItem.ChecklistItemBuilder checklistItem = ChecklistItem.builder();

        checklistItem.assigneeId( request.getAssigneeId() );
        checklistItem.dueDate( request.getDueDate() );
        checklistItem.text( request.getText() );

        return checklistItem.build();
    }

    @Override
    public ChecklistItemResponse toItemResponse(ChecklistItem item) {
        if ( item == null ) {
            return null;
        }

        ChecklistItemResponse.ChecklistItemResponseBuilder checklistItemResponse = ChecklistItemResponse.builder();

        checklistItemResponse.assigneeId( item.getAssigneeId() );
        checklistItemResponse.dueDate( item.getDueDate() );
        checklistItemResponse.itemId( item.getItemId() );
        checklistItemResponse.text( item.getText() );

        return checklistItemResponse.build();
    }

    @Override
    public void updateEntity(ChecklistRequest request, Checklist checklist) {
        if ( request == null ) {
            return;
        }

        checklist.setPosition( request.getPosition() );
        checklist.setTitle( request.getTitle() );
    }

    @Override
    public void updateItemEntity(ChecklistItemRequest request, ChecklistItem item) {
        if ( request == null ) {
            return;
        }

        item.setAssigneeId( request.getAssigneeId() );
        item.setDueDate( request.getDueDate() );
        item.setText( request.getText() );
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
