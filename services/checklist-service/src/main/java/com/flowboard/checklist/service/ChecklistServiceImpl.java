package com.flowboard.checklist.service;

import com.flowboard.checklist.dto.request.ChecklistItemRequest;
import com.flowboard.checklist.dto.request.ChecklistRequest;
import com.flowboard.checklist.dto.response.ChecklistProgressResponse;
import com.flowboard.checklist.dto.response.ChecklistResponse;
import com.flowboard.checklist.entity.Checklist;
import com.flowboard.checklist.entity.ChecklistItem;
import com.flowboard.checklist.exception.ResourceNotFoundException;
import com.flowboard.checklist.mapper.ChecklistMapper;
import com.flowboard.checklist.repository.ChecklistItemRepository;
import com.flowboard.checklist.repository.ChecklistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ChecklistServiceImpl implements ChecklistService {

    private final ChecklistRepository checklistRepository;
    private final ChecklistItemRepository checklistItemRepository;
    private final ChecklistMapper checklistMapper;

    @Override
    public ChecklistResponse createChecklist(ChecklistRequest request) {
        Checklist checklist = checklistMapper.toEntity(request);
        return checklistMapper.toResponse(checklistRepository.save(checklist));
    }

    @Override
    public ChecklistResponse updateChecklist(Long checklistId, ChecklistRequest request) {
        Checklist checklist = checklistRepository.findById(checklistId)
                .orElseThrow(() -> new ResourceNotFoundException("Checklist not found"));
        checklistMapper.updateEntity(request, checklist);
        return checklistMapper.toResponse(checklistRepository.save(checklist));
    }

    @Override
    public void deleteChecklist(Long checklistId) {
        checklistRepository.deleteById(checklistId);
    }

    @Override
    public List<ChecklistResponse> getChecklistsByCard(Long cardId) {
        return checklistRepository.findByCardIdOrderByPositionAsc(cardId).stream()
                .map(checklistMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void addItem(Long checklistId, ChecklistItemRequest request) {
        Checklist checklist = checklistRepository.findById(checklistId)
                .orElseThrow(() -> new ResourceNotFoundException("Checklist not found"));
        ChecklistItem item = checklistMapper.toItemEntity(request);
        item.setChecklist(checklist);
        checklistItemRepository.save(item);
    }

    @Override
    public void updateItem(Long itemId, ChecklistItemRequest request) {
        ChecklistItem item = checklistItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Checklist item not found"));
        checklistMapper.updateItemEntity(request, item);
        checklistItemRepository.save(item);
    }

    @Override
    public void deleteItem(Long itemId) {
        checklistItemRepository.deleteById(itemId);
    }

    @Override
    public void toggleItem(Long itemId) {
        ChecklistItem item = checklistItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Checklist item not found"));
        item.setCompleted(!item.isCompleted());
        checklistItemRepository.save(item);
    }

    @Override
    public ChecklistProgressResponse getChecklistProgress(Long cardId) {
        List<Checklist> checklists = checklistRepository.findByCardIdOrderByPositionAsc(cardId);
        int totalItems = 0;
        int completedItems = 0;

        for (Checklist checklist : checklists) {
            for (ChecklistItem item : checklist.getItems()) {
                totalItems++;
                if (item.isCompleted()) {
                    completedItems++;
                }
            }
        }

        double progress = totalItems == 0 ? 0 : (double) completedItems / totalItems * 100;

        return ChecklistProgressResponse.builder()
                .cardId(cardId)
                .totalItems(totalItems)
                .completedItems(completedItems)
                .progressPercentage(progress)
                .build();
    }
}
