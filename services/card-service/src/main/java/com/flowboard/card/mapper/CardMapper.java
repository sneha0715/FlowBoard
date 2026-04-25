package com.flowboard.card.mapper;

import com.flowboard.card.dto.request.CardRequest;
import com.flowboard.card.dto.response.CardResponse;
import com.flowboard.card.entity.Card;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface CardMapper {

    CardResponse toResponse(Card card);

    @Mapping(target = "cardId", ignore = true)
    @Mapping(target = "createdById", ignore = true)
    @Mapping(target = "archived", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Card toEntity(CardRequest request);

    @Mapping(target = "cardId", ignore = true)
    @Mapping(target = "createdById", ignore = true)
    @Mapping(target = "archived", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "boardId", ignore = true)
    @Mapping(target = "listId", ignore = true)
    void updateEntityFromRequest(CardRequest request, @MappingTarget Card card);
}

