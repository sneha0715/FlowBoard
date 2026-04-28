package com.flowboard.checklist.mapper;

import com.flowboard.checklist.dto.request.LabelRequest;
import com.flowboard.checklist.dto.response.LabelResponse;
import com.flowboard.checklist.entity.Label;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface LabelMapper {

    @Mapping(target = "labelId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    Label toEntity(LabelRequest request);

    LabelResponse toResponse(Label label);

    @Mapping(target = "labelId", ignore = true)
    @Mapping(target = "boardId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    void updateEntity(LabelRequest request, @MappingTarget Label label);
}
