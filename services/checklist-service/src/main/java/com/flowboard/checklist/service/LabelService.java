package com.flowboard.checklist.service;

import com.flowboard.checklist.dto.request.ChecklistItemRequest;
import com.flowboard.checklist.dto.request.ChecklistRequest;
import com.flowboard.checklist.dto.request.LabelRequest;
import com.flowboard.checklist.dto.response.ChecklistProgressResponse;
import com.flowboard.checklist.dto.response.ChecklistResponse;
import com.flowboard.checklist.dto.response.LabelResponse;

import java.util.List;

public interface LabelService {
    // Label Operations
    LabelResponse createLabel(LabelRequest request);
    List<LabelResponse> getLabelsByBoard(Long boardId);
    LabelResponse updateLabel(Long labelId, LabelRequest request);
    void deleteLabel(Long labelId);
    
    // Card-Label Operations
    void addLabelToCard(Long cardId, Long labelId);
    void removeLabelFromCard(Long cardId, Long labelId);
    List<LabelResponse> getLabelsForCard(Long cardId);
}
