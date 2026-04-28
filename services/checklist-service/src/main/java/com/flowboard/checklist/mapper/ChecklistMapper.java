package com.flowboard.checklist.mapper;

import com.flowboard.checklist.dto.request.ChecklistItemRequest;
import com.flowboard.checklist.dto.request.ChecklistRequest;
import com.flowboard.checklist.dto.response.ChecklistItemResponse;
import com.flowboard.checklist.dto.response.ChecklistResponse;
import com.flowboard.checklist.entity.Checklist;
import com.flowboard.checklist.entity.ChecklistItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ChecklistMapper {

    @Mapping(target = "items", ignore = true)
    Checklist toEntity(ChecklistRequest request);

    ChecklistResponse toResponse(Checklist checklist);

    @Mapping(target = "itemId", ignore = true)
    @Mapping(target = "checklist", ignore = true)
    @Mapping(target = "completed", ignore = true)
    ChecklistItem toItemEntity(ChecklistItemRequest request);

    ChecklistItemResponse toItemResponse(ChecklistItem item);

    @Mapping(target = "checklistId", ignore = true)
    @Mapping(target = "cardId", ignore = true)
    @Mapping(target = "items", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    void updateEntity(ChecklistRequest request, @MappingTarget Checklist checklist);

    @Mapping(target = "itemId", ignore = true)
    @Mapping(target = "checklist", ignore = true)
    @Mapping(target = "completed", ignore = true)
    void updateItemEntity(ChecklistItemRequest request, @MappingTarget ChecklistItem item);
}
