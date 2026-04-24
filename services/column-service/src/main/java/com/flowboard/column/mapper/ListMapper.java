package com.flowboard.column.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import com.flowboard.column.dto.request.ListRequest;
import com.flowboard.column.dto.response.ListResponse;
import com.flowboard.column.model.TaskList;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ListMapper {

    TaskList toEntity(ListRequest request);

    ListResponse toResponse(TaskList taskList);

    void updateEntityFromRequest(ListRequest request, @MappingTarget TaskList taskList);
}
