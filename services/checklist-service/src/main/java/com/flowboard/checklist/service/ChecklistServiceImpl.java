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
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
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
        ChecklistResponse response = checklistMapper.toResponse(checklistRepository.save(checklist));
        log.info("Checklist created: id={}, cardId={}", response.getChecklistId(), request.getCardId());
        return response;
    }

    @Override
    public ChecklistResponse updateChecklist(Long checklistId, ChecklistRequest request) {
        Checklist checklist = checklistRepository.findById(checklistId)
                .orElseThrow(() -> new ResourceNotFoundException("Checklist not found"));
        checklistMapper.updateEntity(request, checklist);
        ChecklistResponse response = checklistMapper.toResponse(checklistRepository.save(checklist));
        log.info("Checklist updated: id={}", checklistId);
        return response;
    }

    @Override
    public void deleteChecklist(Long checklistId) {
        checklistRepository.deleteById(checklistId);
        log.info("Checklist deleted: id={}", checklistId);
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
        log.info("Checklist item added: checklistId={}", checklistId);
    }

    @Override
    public void updateItem(Long itemId, ChecklistItemRequest request) {
        ChecklistItem item = checklistItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Checklist item not found"));
        checklistMapper.updateItemEntity(request, item);
        checklistItemRepository.save(item);
        log.info("Checklist item updated: id={}", itemId);
    }

    @Override
    public void deleteItem(Long itemId) {
        checklistItemRepository.deleteById(itemId);
        log.info("Checklist item deleted: id={}", itemId);
    }

    @Override
    public void toggleItem(Long itemId) {
        ChecklistItem item = checklistItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Checklist item not found"));
        item.setCompleted(!item.isCompleted());
        checklistItemRepository.save(item);
        log.info("Checklist item toggled: id={}, completed={}", itemId, item.isCompleted());
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
