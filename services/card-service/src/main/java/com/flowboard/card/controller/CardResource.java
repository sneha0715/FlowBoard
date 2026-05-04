package com.flowboard.card.controller;

import com.flowboard.card.dto.request.CardRequest;
import com.flowboard.card.dto.response.ApiResponse;
import com.flowboard.card.dto.response.CardResponse;
import com.flowboard.card.model.Priority;
import com.flowboard.card.model.Status;
import com.flowboard.card.service.CardService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cards")
@RequiredArgsConstructor
public class CardResource {

    private final CardService cardService;

    @PostMapping
    public ResponseEntity<ApiResponse<CardResponse>> createCard(@Valid @RequestBody CardRequest request, HttpServletRequest httpRequest) {
        CardResponse response = cardService.createCard(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Card created successfully", httpRequest.getRequestURI()));
    }

    @GetMapping("/{cardId}")
    public ResponseEntity<ApiResponse<CardResponse>> getCardById(@PathVariable Long cardId, HttpServletRequest httpRequest) {
        CardResponse response = cardService.getCardById(cardId);
        return ResponseEntity.ok(ApiResponse.success(response, "Card retrieved successfully", httpRequest.getRequestURI()));
    }

    @GetMapping("/list/{listId}")
    public ResponseEntity<ApiResponse<List<CardResponse>>> getCardsByList(@PathVariable Long listId, HttpServletRequest httpRequest) {
        List<CardResponse> response = cardService.getCardsByList(listId);
        return ResponseEntity.ok(ApiResponse.success(response, "Cards retrieved successfully", httpRequest.getRequestURI()));
    }

    @GetMapping("/board/{boardId}")
    public ResponseEntity<ApiResponse<List<CardResponse>>> getCardsByBoard(@PathVariable Long boardId, HttpServletRequest httpRequest) {
        List<CardResponse> response = cardService.getCardsByBoard(boardId);
        return ResponseEntity.ok(ApiResponse.success(response, "Cards retrieved successfully", httpRequest.getRequestURI()));
    }

    @GetMapping("/assignee/{assigneeId}")
    public ResponseEntity<ApiResponse<List<CardResponse>>> getCardsByAssignee(@PathVariable Long assigneeId, HttpServletRequest httpRequest) {
        List<CardResponse> response = cardService.getCardsByAssignee(assigneeId);
        return ResponseEntity.ok(ApiResponse.success(response, "Cards retrieved successfully", httpRequest.getRequestURI()));
    }

    @PutMapping("/{cardId}")
    public ResponseEntity<ApiResponse<CardResponse>> updateCard(@PathVariable Long cardId, @Valid @RequestBody CardRequest request, HttpServletRequest httpRequest) {
        CardResponse response = cardService.updateCard(cardId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Card updated successfully", httpRequest.getRequestURI()));
    }

    @PutMapping("/{cardId}/move")
    public ResponseEntity<ApiResponse<CardResponse>> moveCard(@PathVariable Long cardId, @RequestParam Long newListId, @RequestParam int newPosition, HttpServletRequest httpRequest) {
        CardResponse response = cardService.moveCard(cardId, newListId, newPosition);
        return ResponseEntity.ok(ApiResponse.success(response, "Card moved successfully", httpRequest.getRequestURI()));
    }

    @PutMapping("/reorder/{listId}")
    public ResponseEntity<ApiResponse<Void>> reorderCards(@PathVariable Long listId, @RequestBody List<Long> cardIds, HttpServletRequest httpRequest) {
        cardService.reorderCards(listId, cardIds);
        return ResponseEntity.ok(ApiResponse.success(null, "Cards reordered successfully", httpRequest.getRequestURI()));
    }

    @PostMapping("/{cardId}/archive")
    public ResponseEntity<ApiResponse<Void>> archiveCard(@PathVariable Long cardId, HttpServletRequest httpRequest) {
        cardService.archiveCard(cardId);
        return ResponseEntity.ok(ApiResponse.success(null, "Card archived successfully", httpRequest.getRequestURI()));
    }

    @PostMapping("/{cardId}/unarchive")
    public ResponseEntity<ApiResponse<Void>> unarchiveCard(@PathVariable Long cardId, HttpServletRequest httpRequest) {
        cardService.unarchiveCard(cardId);
        return ResponseEntity.ok(ApiResponse.success(null, "Card unarchived successfully", httpRequest.getRequestURI()));
    }

    @DeleteMapping("/{cardId}")
    public ResponseEntity<ApiResponse<Void>> deleteCard(@PathVariable Long cardId, HttpServletRequest httpRequest) {
        cardService.deleteCard(cardId);
        return ResponseEntity.ok(ApiResponse.success(null, "Card deleted successfully", httpRequest.getRequestURI()));
    }

    @PutMapping("/{cardId}/assignee")
    public ResponseEntity<ApiResponse<Void>> setAssignee(@PathVariable Long cardId, @RequestParam Long assigneeId, HttpServletRequest httpRequest) {
        cardService.setAssignee(cardId, assigneeId);
        return ResponseEntity.ok(ApiResponse.success(null, "Assignee updated successfully", httpRequest.getRequestURI()));
    }

    @PutMapping("/{cardId}/priority")
    public ResponseEntity<ApiResponse<Void>> setPriority(@PathVariable Long cardId, @RequestParam Priority priority, HttpServletRequest httpRequest) {
        cardService.setPriority(cardId, priority);
        return ResponseEntity.ok(ApiResponse.success(null, "Priority updated successfully", httpRequest.getRequestURI()));
    }

    @PutMapping("/{cardId}/status")
    public ResponseEntity<ApiResponse<Void>> setStatus(@PathVariable Long cardId, @RequestParam Status status, HttpServletRequest httpRequest) {
        cardService.setStatus(cardId, status);
        return ResponseEntity.ok(ApiResponse.success(null, "Status updated successfully", httpRequest.getRequestURI()));
    }

    @GetMapping("/overdue")
    public ResponseEntity<ApiResponse<List<CardResponse>>> getOverdueCards(HttpServletRequest httpRequest) {
        List<CardResponse> response = cardService.getOverdueCards();
        return ResponseEntity.ok(ApiResponse.success(response, "Overdue cards retrieved successfully", httpRequest.getRequestURI()));
    }
}
