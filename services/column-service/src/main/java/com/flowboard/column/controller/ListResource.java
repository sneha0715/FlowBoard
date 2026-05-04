package com.flowboard.column.controller;

import com.flowboard.column.dto.request.ListRequest;
import com.flowboard.column.dto.response.ApiResponse;
import com.flowboard.column.dto.response.ListResponse;
import com.flowboard.column.service.ListService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/columns")
@RequiredArgsConstructor
public class ListResource {

    private final ListService listService;

    @PostMapping
    public ResponseEntity<ApiResponse<ListResponse>> createList(@Valid @RequestBody ListRequest request) {
        ListResponse response = listService.createList(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "List created successfully"));
    }

    @GetMapping("/{listId}")
    public ResponseEntity<ApiResponse<ListResponse>> getListById(@PathVariable Long listId) {
        ListResponse response = listService.getListById(listId);
        return ResponseEntity.ok(ApiResponse.success(response, "List retrieved successfully"));
    }

    @GetMapping("/board/{boardId}")
    public ResponseEntity<ApiResponse<List<ListResponse>>> getByBoard(@PathVariable Long boardId) {
        List<ListResponse> response = listService.getListsByBoard(boardId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lists retrieved successfully"));
    }

    @PutMapping("/{listId}")
    public ResponseEntity<ApiResponse<ListResponse>> updateList(
            @PathVariable Long listId,
            @Valid @RequestBody ListRequest request
    ) {
        ListResponse response = listService.updateList(listId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "List updated successfully"));
    }

    @PutMapping("/reorder/{boardId}")
    public ResponseEntity<ApiResponse<Void>> reorderLists(
            @PathVariable Long boardId,
            @RequestBody List<Long> listIds
    ) {
        listService.reorderLists(boardId, listIds);
        return ResponseEntity.ok(ApiResponse.success(null, "Lists reordered successfully"));
    }

    @PostMapping("/{listId}/archive")
    public ResponseEntity<ApiResponse<Void>> archiveList(@PathVariable Long listId) {
        listService.archiveList(listId);
        return ResponseEntity.ok(ApiResponse.success(null, "List archived successfully"));
    }

    @PostMapping("/{listId}/unarchive")
    public ResponseEntity<ApiResponse<Void>> unarchiveList(@PathVariable Long listId) {
        listService.unarchiveList(listId);
        return ResponseEntity.ok(ApiResponse.success(null, "List unarchived successfully"));
    }

    @DeleteMapping("/{listId}")
    public ResponseEntity<ApiResponse<Void>> deleteList(@PathVariable Long listId) {
        listService.deleteList(listId);
        return ResponseEntity.ok(ApiResponse.success(null, "List deleted successfully"));
    }

    @PutMapping("/{listId}/move/{newBoardId}")
    public ResponseEntity<ApiResponse<ListResponse>> moveList(
            @PathVariable Long listId,
            @PathVariable Long newBoardId
    ) {
        ListResponse response = listService.moveList(listId, newBoardId);
        return ResponseEntity.ok(ApiResponse.success(response, "List moved successfully"));
    }

    @GetMapping("/board/{boardId}/archived")
    public ResponseEntity<ApiResponse<List<ListResponse>>> getArchivedLists(@PathVariable Long boardId) {
        List<ListResponse> response = listService.getArchivedLists(boardId);
        return ResponseEntity.ok(ApiResponse.success(response, "Archived lists retrieved successfully"));
    }
}
