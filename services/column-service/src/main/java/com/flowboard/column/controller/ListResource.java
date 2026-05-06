package com.flowboard.column.controller;

import com.flowboard.column.dto.request.ListRequest;
import com.flowboard.column.dto.response.ApiResponse;
import com.flowboard.column.dto.response.ListResponse;
import com.flowboard.column.service.ListService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/columns")
@RequiredArgsConstructor
public class ListResource {

    private final ListService listService;

    @PostMapping
    @PreAuthorize("@columnSecurity.hasBoardRole(#request.boardId, #requesterId, 'ADMIN', 'MEMBER')")
    public ResponseEntity<ApiResponse<ListResponse>> createList(
            @Valid @RequestBody ListRequest request,
            @RequestAttribute(value = "userId", required = false) Long requesterId) {
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
    @PreAuthorize("@columnSecurity.isBoardMember(#boardId, #requesterId)")
    public ResponseEntity<ApiResponse<List<ListResponse>>> getByBoard(
            @PathVariable Long boardId,
            @RequestAttribute(value = "userId", required = false) Long requesterId) {
        List<ListResponse> response = listService.getListsByBoard(boardId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lists retrieved successfully"));
    }

    @PutMapping("/{listId}")
    @PreAuthorize("@columnSecurity.canModifyList(#listId, #requesterId)")
    public ResponseEntity<ApiResponse<ListResponse>> updateList(
            @PathVariable Long listId,
            @Valid @RequestBody ListRequest request,
            @RequestAttribute(value = "userId", required = false) Long requesterId
    ) {
        ListResponse response = listService.updateList(listId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "List updated successfully"));
    }

    @PutMapping("/reorder/{boardId}")
    @PreAuthorize("@columnSecurity.hasBoardRole(#boardId, #requesterId, 'ADMIN', 'MEMBER')")
    public ResponseEntity<ApiResponse<Void>> reorderLists(
            @PathVariable Long boardId,
            @RequestBody List<Long> listIds,
            @RequestAttribute(value = "userId", required = false) Long requesterId
    ) {
        listService.reorderLists(boardId, listIds);
        return ResponseEntity.ok(ApiResponse.success(null, "Lists reordered successfully"));
    }

    @PostMapping("/{listId}/archive")
    @PreAuthorize("@columnSecurity.canModifyList(#listId, #requesterId)")
    public ResponseEntity<ApiResponse<Void>> archiveList(
            @PathVariable Long listId,
            @RequestAttribute(value = "userId", required = false) Long requesterId) {
        listService.archiveList(listId);
        return ResponseEntity.ok(ApiResponse.success(null, "List archived successfully"));
    }

    @PostMapping("/{listId}/unarchive")
    @PreAuthorize("@columnSecurity.canModifyList(#listId, #requesterId)")
    public ResponseEntity<ApiResponse<Void>> unarchiveList(
            @PathVariable Long listId,
            @RequestAttribute(value = "userId", required = false) Long requesterId) {
        listService.unarchiveList(listId);
        return ResponseEntity.ok(ApiResponse.success(null, "List unarchived successfully"));
    }

    @DeleteMapping("/{listId}")
    @PreAuthorize("@columnSecurity.canModifyList(#listId, #requesterId)")
    public ResponseEntity<ApiResponse<Void>> deleteList(
            @PathVariable Long listId,
            @RequestAttribute(value = "userId", required = false) Long requesterId) {
        listService.deleteList(listId);
        return ResponseEntity.ok(ApiResponse.success(null, "List deleted successfully"));
    }

    @PutMapping("/{listId}/move/{newBoardId}")
    @PreAuthorize("@columnSecurity.canModifyList(#listId, #requesterId) && @columnSecurity.hasBoardRole(#newBoardId, #requesterId, 'ADMIN', 'MEMBER')")
    public ResponseEntity<ApiResponse<ListResponse>> moveList(
            @PathVariable Long listId,
            @PathVariable Long newBoardId,
            @RequestAttribute(value = "userId", required = false) Long requesterId
    ) {
        ListResponse response = listService.moveList(listId, newBoardId);
        return ResponseEntity.ok(ApiResponse.success(response, "List moved successfully"));
    }

    @GetMapping("/board/{boardId}/archived")
    @PreAuthorize("@columnSecurity.hasBoardRole(#boardId, #requesterId, 'ADMIN', 'MEMBER')")
    public ResponseEntity<ApiResponse<List<ListResponse>>> getArchivedLists(
            @PathVariable Long boardId,
            @RequestAttribute(value = "userId", required = false) Long requesterId) {
        List<ListResponse> response = listService.getArchivedLists(boardId);
        return ResponseEntity.ok(ApiResponse.success(response, "Archived lists retrieved successfully"));
    }
}
