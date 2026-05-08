package com.flowboard.checklist.mapper;

import com.flowboard.checklist.dto.request.LabelRequest;
import com.flowboard.checklist.dto.response.LabelResponse;
import com.flowboard.checklist.entity.Label;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-09T00:37:38+0530",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class LabelMapperImpl implements LabelMapper {

    @Override
    public Label toEntity(LabelRequest request) {
        if ( request == null ) {
            return null;
        }

        Label.LabelBuilder label = Label.builder();

        label.boardId( request.getBoardId() );
        label.color( request.getColor() );
        label.name( request.getName() );

        return label.build();
    }

    @Override
    public LabelResponse toResponse(Label label) {
        if ( label == null ) {
            return null;
        }

        LabelResponse.LabelResponseBuilder labelResponse = LabelResponse.builder();

        labelResponse.boardId( label.getBoardId() );
        labelResponse.color( label.getColor() );
        labelResponse.createdAt( label.getCreatedAt() );
        labelResponse.labelId( label.getLabelId() );
        labelResponse.name( label.getName() );

        return labelResponse.build();
    }

    @Override
    public void updateEntity(LabelRequest request, Label label) {
        if ( request == null ) {
            return;
        }

        label.setColor( request.getColor() );
        label.setName( request.getName() );
    }
}
