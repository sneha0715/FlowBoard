package com.flowboard.checklist.controller;

import com.flowboard.checklist.dto.request.LabelRequest;
import com.flowboard.checklist.dto.response.ApiResponse;
import com.flowboard.checklist.dto.response.LabelResponse;
import com.flowboard.checklist.service.LabelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/labels")
@RequiredArgsConstructor
public class LabelResource {

    private final LabelService labelService;

    @PostMapping
    public ResponseEntity<ApiResponse<LabelResponse>> createLabel(@Valid @RequestBody LabelRequest request) {
        LabelResponse response = labelService.createLabel(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Label created successfully"));
    }

    @GetMapping("/board/{boardId}")
    public ResponseEntity<ApiResponse<List<LabelResponse>>> getLabelsByBoard(@PathVariable Long boardId) {
        List<LabelResponse> response = labelService.getLabelsByBoard(boardId);
        return ResponseEntity.ok(ApiResponse.success(response, "Labels retrieved successfully"));
    }

    @PutMapping("/{labelId}")
    public ResponseEntity<ApiResponse<LabelResponse>> updateLabel(@PathVariable Long labelId, @Valid @RequestBody LabelRequest request) {
        LabelResponse response = labelService.updateLabel(labelId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Label updated successfully"));
    }

    @DeleteMapping("/{labelId}")
    public ResponseEntity<ApiResponse<Void>> deleteLabel(@PathVariable Long labelId) {
        labelService.deleteLabel(labelId);
        return ResponseEntity.ok(ApiResponse.success(null, "Label deleted successfully"));
    }

    // --- Card-Label Association Endpoints ---

    @PostMapping("/card/{cardId}/assign/{labelId}")
    public ResponseEntity<ApiResponse<Void>> addLabelToCard(@PathVariable Long cardId, @PathVariable Long labelId) {
        labelService.addLabelToCard(cardId, labelId);
        return ResponseEntity.ok(ApiResponse.success(null, "Label assigned to card successfully"));
    }

    @DeleteMapping("/card/{cardId}/remove/{labelId}")
    public ResponseEntity<ApiResponse<Void>> removeLabelFromCard(@PathVariable Long cardId, @PathVariable Long labelId) {
        labelService.removeLabelFromCard(cardId, labelId);
        return ResponseEntity.ok(ApiResponse.success(null, "Label removed from card successfully"));
    }

    @GetMapping("/card/{cardId}")
    public ResponseEntity<ApiResponse<List<LabelResponse>>> getLabelsForCard(@PathVariable Long cardId) {
        List<LabelResponse> response = labelService.getLabelsForCard(cardId);
        return ResponseEntity.ok(ApiResponse.success(response, "Card labels retrieved successfully"));
    }
}
