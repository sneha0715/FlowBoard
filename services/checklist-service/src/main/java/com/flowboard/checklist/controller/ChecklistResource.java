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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/checklists")
@RequiredArgsConstructor
public class ChecklistResource {

    private final ChecklistService checklistService;

    @PostMapping
    @PreAuthorize("@checklistSecurity.isBoardMemberByCardId(#request.cardId, #requesterId)")
    public ResponseEntity<ApiResponse<ChecklistResponse>> createChecklist(
            @Valid @RequestBody ChecklistRequest request,
            @RequestAttribute(value = "userId", required = false) Long requesterId) {
        ChecklistResponse response = checklistService.createChecklist(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Checklist created successfully"));
    }

    @PutMapping("/{checklistId}")
    @PreAuthorize("@checklistSecurity.canModifyChecklist(#checklistId, #requesterId)")
    public ResponseEntity<ApiResponse<ChecklistResponse>> updateChecklist(
            @PathVariable Long checklistId,
            @Valid @RequestBody ChecklistRequest request,
            @RequestAttribute(value = "userId", required = false) Long requesterId) {
        ChecklistResponse response = checklistService.updateChecklist(checklistId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Checklist updated successfully"));
    }

    @DeleteMapping("/{checklistId}")
    @PreAuthorize("@checklistSecurity.canModifyChecklist(#checklistId, #requesterId)")
    public ResponseEntity<ApiResponse<Void>> deleteChecklist(
            @PathVariable Long checklistId,
            @RequestAttribute(value = "userId", required = false) Long requesterId) {
        checklistService.deleteChecklist(checklistId);
        return ResponseEntity.ok(ApiResponse.success(null, "Checklist deleted successfully"));
    }

    @GetMapping("/card/{cardId}")
    @PreAuthorize("@checklistSecurity.isBoardMemberByCardId(#cardId, #requesterId)")
    public ResponseEntity<ApiResponse<List<ChecklistResponse>>> getChecklistsByCard(
            @PathVariable Long cardId,
            @RequestAttribute(value = "userId", required = false) Long requesterId) {
        List<ChecklistResponse> response = checklistService.getChecklistsByCard(cardId);
        return ResponseEntity.ok(ApiResponse.success(response, "Checklists retrieved successfully"));
    }

    @PostMapping("/{checklistId}/items")
    @PreAuthorize("@checklistSecurity.canModifyChecklist(#checklistId, #requesterId)")
    public ResponseEntity<ApiResponse<Void>> addItem(
            @PathVariable Long checklistId,
            @Valid @RequestBody ChecklistItemRequest request,
            @RequestAttribute(value = "userId", required = false) Long requesterId) {
        checklistService.addItem(checklistId, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Item added to checklist successfully"));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<Void>> updateItem(@PathVariable Long itemId, @Valid @RequestBody ChecklistItemRequest request) {
        // More complex to secure individual items without mapping to checklist in security
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
    @PreAuthorize("@checklistSecurity.isBoardMemberByCardId(#cardId, #requesterId)")
    public ResponseEntity<ApiResponse<ChecklistProgressResponse>> getChecklistProgress(
            @PathVariable Long cardId,
            @RequestAttribute(value = "userId", required = false) Long requesterId) {
        ChecklistProgressResponse response = checklistService.getChecklistProgress(cardId);
        return ResponseEntity.ok(ApiResponse.success(response, "Checklist progress retrieved successfully"));
    }
}
