package com.flowboard.card.mapper;

import com.flowboard.card.dto.request.CardRequest;
import com.flowboard.card.dto.response.CardResponse;
import com.flowboard.card.entity.Card;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-06T16:14:23+0530",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class CardMapperImpl implements CardMapper {

    @Override
    public CardResponse toResponse(Card card) {
        if ( card == null ) {
            return null;
        }

        CardResponse cardResponse = new CardResponse();

        cardResponse.setArchived( card.isArchived() );
        cardResponse.setAssigneeId( card.getAssigneeId() );
        cardResponse.setBoardId( card.getBoardId() );
        cardResponse.setCardId( card.getCardId() );
        cardResponse.setCoverColor( card.getCoverColor() );
        cardResponse.setCreatedAt( card.getCreatedAt() );
        cardResponse.setCreatedById( card.getCreatedById() );
        cardResponse.setDescription( card.getDescription() );
        cardResponse.setDueDate( card.getDueDate() );
        cardResponse.setListId( card.getListId() );
        cardResponse.setPosition( card.getPosition() );
        cardResponse.setPriority( card.getPriority() );
        cardResponse.setStartDate( card.getStartDate() );
        cardResponse.setStatus( card.getStatus() );
        cardResponse.setTitle( card.getTitle() );
        cardResponse.setUpdatedAt( card.getUpdatedAt() );

        return cardResponse;
    }

    @Override
    public Card toEntity(CardRequest request) {
        if ( request == null ) {
            return null;
        }

        Card.CardBuilder card = Card.builder();

        card.assigneeId( request.getAssigneeId() );
        card.boardId( request.getBoardId() );
        card.coverColor( request.getCoverColor() );
        card.description( request.getDescription() );
        card.dueDate( request.getDueDate() );
        card.listId( request.getListId() );
        if ( request.getPosition() != null ) {
            card.position( request.getPosition() );
        }
        card.priority( request.getPriority() );
        card.startDate( request.getStartDate() );
        card.status( request.getStatus() );
        card.title( request.getTitle() );

        return card.build();
    }

    @Override
    public void updateEntityFromRequest(CardRequest request, Card card) {
        if ( request == null ) {
            return;
        }

        card.setAssigneeId( request.getAssigneeId() );
        card.setCoverColor( request.getCoverColor() );
        card.setDescription( request.getDescription() );
        card.setDueDate( request.getDueDate() );
        if ( request.getPosition() != null ) {
            card.setPosition( request.getPosition() );
        }
        card.setPriority( request.getPriority() );
        card.setStartDate( request.getStartDate() );
        card.setStatus( request.getStatus() );
        card.setTitle( request.getTitle() );
    }
}
