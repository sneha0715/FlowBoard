package com.flowboard.checklist.mapper;

import com.flowboard.checklist.dto.request.LabelRequest;
import com.flowboard.checklist.dto.response.LabelResponse;
import com.flowboard.checklist.entity.Label;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-11T23:38:21+0530",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 20.0.1 (Oracle Corporation)"
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
        label.name( request.getName() );
        label.color( request.getColor() );

        return label.build();
    }

    @Override
    public LabelResponse toResponse(Label label) {
        if ( label == null ) {
            return null;
        }

        LabelResponse.LabelResponseBuilder labelResponse = LabelResponse.builder();

        labelResponse.labelId( label.getLabelId() );
        labelResponse.boardId( label.getBoardId() );
        labelResponse.name( label.getName() );
        labelResponse.color( label.getColor() );
        labelResponse.createdAt( label.getCreatedAt() );

        return labelResponse.build();
    }

    @Override
    public void updateEntity(LabelRequest request, Label label) {
        if ( request == null ) {
            return;
        }

        label.setName( request.getName() );
        label.setColor( request.getColor() );
    }
}
