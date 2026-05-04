package com.flowboard.checklist.controller;

import com.flowboard.checklist.dto.request.ChecklistItemRequest;
import com.flowboard.checklist.dto.request.ChecklistRequest;
import com.flowboard.checklist.dto.response.ApiResponse;
import com.flowboard.checklist.dto.response.ChecklistProgressResponse;
import com.flowboard.checklist.dto.response.ChecklistResponse;
import com.flowboard.checklist.service.ChecklistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/checklists")
@RequiredArgsConstructor
public class ChecklistResource {

    private final ChecklistService checklistService;

    @PostMapping
    public ResponseEntity<ApiResponse<ChecklistResponse>> createChecklist(@Valid @RequestBody ChecklistRequest request) {
        ChecklistResponse response = checklistService.createChecklist(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Checklist created successfully"));
    }

    @PutMapping("/{checklistId}")
    public ResponseEntity<ApiResponse<ChecklistResponse>> updateChecklist(@PathVariable Long checklistId, @Valid @RequestBody ChecklistRequest request) {
        ChecklistResponse response = checklistService.updateChecklist(checklistId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Checklist updated successfully"));
    }

    @DeleteMapping("/{checklistId}")
    public ResponseEntity<ApiResponse<Void>> deleteChecklist(@PathVariable Long checklistId) {
        checklistService.deleteChecklist(checklistId);
        return ResponseEntity.ok(ApiResponse.success(null, "Checklist deleted successfully"));
    }

    @GetMapping("/card/{cardId}")
    public ResponseEntity<ApiResponse<List<ChecklistResponse>>> getChecklistsByCard(@PathVariable Long cardId) {
        List<ChecklistResponse> response = checklistService.getChecklistsByCard(cardId);
        return ResponseEntity.ok(ApiResponse.success(response, "Checklists retrieved successfully"));
    }

    @PostMapping("/{checklistId}/items")
    public ResponseEntity<ApiResponse<Void>> addItem(@PathVariable Long checklistId, @Valid @RequestBody ChecklistItemRequest request) {
        checklistService.addItem(checklistId, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Item added to checklist successfully"));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<Void>> updateItem(@PathVariable Long itemId, @Valid @RequestBody ChecklistItemRequest request) {
        checklistService.updateItem(itemId, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Checklist item updated successfully"));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<Void>> deleteItem(@PathVariable Long itemId) {
        checklistService.deleteItem(itemId);
        return ResponseEntity.ok(ApiResponse.success(null, "Checklist item deleted successfully"));
    }

    @PutMapping("/items/{itemId}/toggle")
    public ResponseEntity<ApiResponse<Void>> toggleItem(@PathVariable Long itemId) {
        checklistService.toggleItem(itemId);
        return ResponseEntity.ok(ApiResponse.success(null, "Item status toggled successfully"));
    }

    @GetMapping("/card/{cardId}/progress")
    public ResponseEntity<ApiResponse<ChecklistProgressResponse>> getChecklistProgress(@PathVariable Long cardId) {
        ChecklistProgressResponse response = checklistService.getChecklistProgress(cardId);
        return ResponseEntity.ok(ApiResponse.success(response, "Checklist progress retrieved successfully"));
    }
}
