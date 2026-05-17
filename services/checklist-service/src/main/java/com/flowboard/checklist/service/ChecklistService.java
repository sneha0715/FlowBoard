package com.flowboard.checklist.service;

import com.flowboard.checklist.dto.request.ChecklistItemRequest;
import com.flowboard.checklist.dto.request.ChecklistRequest;
import com.flowboard.checklist.dto.response.ChecklistProgressResponse;
import com.flowboard.checklist.dto.response.ChecklistResponse;

import java.util.List;

public interface ChecklistService {
    ChecklistResponse createChecklist(ChecklistRequest request);
    ChecklistResponse updateChecklist(Long checklistId, ChecklistRequest request);
    void deleteChecklist(Long checklistId);
    List<ChecklistResponse> getChecklistsByCard(Long cardId);
    
    void addItem(Long checklistId, ChecklistItemRequest request);
    void updateItem(Long itemId, ChecklistItemRequest request);
    void deleteItem(Long itemId);
    void toggleItem(Long itemId);
    ChecklistProgressResponse getChecklistProgress(Long cardId);
    Long getCardIdByChecklistId(Long checklistId);
}
