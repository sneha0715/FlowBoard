package com.flowboard.checklist.service;

import com.flowboard.checklist.dto.request.LabelRequest;
import com.flowboard.checklist.dto.response.LabelResponse;
import com.flowboard.checklist.entity.*;
import com.flowboard.checklist.exception.ResourceNotFoundException;
import com.flowboard.checklist.mapper.LabelMapper;
import com.flowboard.checklist.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class LabelServiceImpl implements LabelService {

    private final LabelRepository labelRepository;
    private final CardLabelRepository cardLabelRepository;
    private final LabelMapper labelMapper;

    @Override
    public LabelResponse createLabel(LabelRequest request) {
        Label label = labelMapper.toEntity(request);
        LabelResponse response = labelMapper.toResponse(labelRepository.save(label));
        log.info("Label created: id={}, boardId={}", response.getLabelId(), request.getBoardId());
        return response;
    }

    @Override
    public List<LabelResponse> getLabelsByBoard(Long boardId) {
        return labelRepository.findByBoardId(boardId).stream()
                .map(labelMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public LabelResponse updateLabel(Long labelId, LabelRequest request) {
        Label label = labelRepository.findById(labelId)
                .orElseThrow(() -> new ResourceNotFoundException("Label not found"));
        labelMapper.updateEntity(request, label);
        LabelResponse response = labelMapper.toResponse(labelRepository.save(label));
        log.info("Label updated: id={}", labelId);
        return response;
    }

    @Override
    public void deleteLabel(Long labelId) {
        cardLabelRepository.deleteByLabelId(labelId);
        labelRepository.deleteById(labelId);
        log.info("Label deleted: id={}", labelId);
    }

    @Override
    public void addLabelToCard(Long cardId, Long labelId) {
        if (!cardLabelRepository.findByCardIdAndLabelId(cardId, labelId).isPresent()) {
            CardLabel cardLabel = CardLabel.builder()
                    .cardId(cardId)
                    .labelId(labelId)
                    .build();
            cardLabelRepository.save(cardLabel);
            log.info("Label attached: labelId={}, cardId={}", labelId, cardId);
        }
    }

    @Override
    public void removeLabelFromCard(Long cardId, Long labelId) {
        cardLabelRepository.deleteByCardIdAndLabelId(cardId, labelId);
        log.info("Label detached: labelId={}, cardId={}", labelId, cardId);
    }

    @Override
    public List<LabelResponse> getLabelsForCard(Long cardId) {
        List<Long> labelIds = cardLabelRepository.findByCardId(cardId).stream()
                .map(CardLabel::getLabelId)
                .collect(Collectors.toList());
        return labelRepository.findAllById(labelIds).stream()
                .map(labelMapper::toResponse)
                .collect(Collectors.toList());
    }
}
