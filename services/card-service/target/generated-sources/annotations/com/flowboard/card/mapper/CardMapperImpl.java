package com.flowboard.card.mapper;

import com.flowboard.card.dto.request.CardRequest;
import com.flowboard.card.dto.response.CardResponse;
import com.flowboard.card.entity.Card;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-17T02:57:54+0530",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 20.0.1 (Oracle Corporation)"
)
@Component
public class CardMapperImpl implements CardMapper {

    @Override
    public CardResponse toResponse(Card card) {
        if ( card == null ) {
            return null;
        }

        CardResponse.CardResponseBuilder cardResponse = CardResponse.builder();

        cardResponse.cardId( card.getCardId() );
        cardResponse.listId( card.getListId() );
        cardResponse.boardId( card.getBoardId() );
        cardResponse.title( card.getTitle() );
        cardResponse.description( card.getDescription() );
        cardResponse.position( card.getPosition() );
        cardResponse.priority( card.getPriority() );
        cardResponse.status( card.getStatus() );
        cardResponse.dueDate( card.getDueDate() );
        cardResponse.startDate( card.getStartDate() );
        cardResponse.assigneeId( card.getAssigneeId() );
        cardResponse.createdById( card.getCreatedById() );
        cardResponse.archived( card.isArchived() );
        cardResponse.coverColor( card.getCoverColor() );
        cardResponse.createdAt( card.getCreatedAt() );
        cardResponse.updatedAt( card.getUpdatedAt() );

        return cardResponse.build();
    }

    @Override
    public Card toEntity(CardRequest request) {
        if ( request == null ) {
            return null;
        }

        Card.CardBuilder card = Card.builder();

        card.listId( request.getListId() );
        card.boardId( request.getBoardId() );
        card.title( request.getTitle() );
        card.description( request.getDescription() );
        if ( request.getPosition() != null ) {
            card.position( request.getPosition() );
        }
        card.priority( request.getPriority() );
        card.status( request.getStatus() );
        card.dueDate( request.getDueDate() );
        card.startDate( request.getStartDate() );
        card.assigneeId( request.getAssigneeId() );
        card.coverColor( request.getCoverColor() );

        return card.build();
    }

    @Override
    public void updateEntityFromRequest(CardRequest request, Card card) {
        if ( request == null ) {
            return;
        }

        card.setTitle( request.getTitle() );
        card.setDescription( request.getDescription() );
        if ( request.getPosition() != null ) {
            card.setPosition( request.getPosition() );
        }
        card.setPriority( request.getPriority() );
        card.setStatus( request.getStatus() );
        card.setDueDate( request.getDueDate() );
        card.setStartDate( request.getStartDate() );
        card.setAssigneeId( request.getAssigneeId() );
        card.setCoverColor( request.getCoverColor() );
    }
}
