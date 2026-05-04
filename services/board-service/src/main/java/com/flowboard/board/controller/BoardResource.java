package com.flowboard.board.controller;

import com.flowboard.board.dto.request.BoardMemberRequest;
import com.flowboard.board.dto.request.BoardRequest;
import com.flowboard.board.dto.response.ApiResponse;
import com.flowboard.board.dto.response.BoardMemberResponse;
import com.flowboard.board.dto.response.BoardResponse;
import com.flowboard.board.service.BoardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/boards")
@RequiredArgsConstructor
public class BoardResource {

    private final BoardService boardService;

    @PostMapping
    public ResponseEntity<ApiResponse<BoardResponse>> createBoard(
            @Valid @RequestBody BoardRequest request,
            @RequestAttribute(value = "userId", required = false) Long requesterId) {
        if (requesterId == null) return unauthorized();
        BoardResponse response = boardService.createBoard(request, requesterId);
        return ResponseEntity.ok(ApiResponse.success(response, "Board created successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BoardResponse>> getById(@PathVariable Long id) {
        BoardResponse response = boardService.getBoardById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Board retrieved successfully"));
    }

    @GetMapping("/workspace/{workspaceId}")
    public ResponseEntity<ApiResponse<List<BoardResponse>>> getByWorkspace(@PathVariable Long workspaceId) {
        List<BoardResponse> response = boardService.getBoardsByWorkspace(workspaceId);
        return ResponseEntity.ok(ApiResponse.success(response, "Boards retrieved successfully"));
    }

    @GetMapping("/member")
    public ResponseEntity<ApiResponse<List<BoardResponse>>> getByMember(
            @RequestAttribute(value = "userId", required = false) Long requesterId) {
        if (requesterId == null) return unauthorized();
        List<BoardResponse> response = boardService.getBoardsByMember(requesterId);
        return ResponseEntity.ok(ApiResponse.success(response, "Boards retrieved successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BoardResponse>> update(@PathVariable Long id, @Valid @RequestBody BoardRequest request,
            @RequestAttribute(value = "userId", required = false) Long requesterId) {
        if (requesterId == null) return unauthorized();
        BoardResponse response = boardService.updateBoard(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Board updated successfully"));
    }

    @PutMapping("/{id}/close")
    public ResponseEntity<ApiResponse<Void>> closeBoard(@PathVariable Long id,
            @RequestAttribute(value = "userId", required = false) Long requesterId) {
        if (requesterId == null) return unauthorized();
        boardService.closeBoard(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Board closed successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id,
            @RequestAttribute(value = "userId", required = false) Long requesterId) {
        if (requesterId == null) return unauthorized();
        boardService.deleteBoard(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Board deleted successfully"));
    }

    // Member endpoints
    @PostMapping("/{id}/members")
    public ResponseEntity<ApiResponse<BoardMemberResponse>> addMember(@PathVariable Long id, @Valid @RequestBody BoardMemberRequest request,
            @RequestAttribute(value = "userId", required = false) Long requesterId) {
        if (requesterId == null) return unauthorized();
        BoardMemberResponse response = boardService.addMember(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Member added successfully"));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(@PathVariable Long id, @PathVariable Long userId,
            @RequestAttribute(value = "userId", required = false) Long requesterId) {
        if (requesterId == null) return unauthorized();
        boardService.removeMember(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Member removed successfully"));
    }

    @PutMapping("/{id}/members/{userId}/role")
    public ResponseEntity<ApiResponse<BoardMemberResponse>> updateRole(@PathVariable Long id, @PathVariable Long userId, @RequestParam String role,
            @RequestAttribute(value = "userId", required = false) Long requesterId) {
        if (requesterId == null) return unauthorized();
        BoardMemberResponse response = boardService.updateMemberRole(id, userId, role);
        return ResponseEntity.ok(ApiResponse.success(response, "Member role updated successfully"));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<List<BoardMemberResponse>>> getMembers(@PathVariable Long id) {
        List<BoardMemberResponse> response = boardService.getMembers(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Members retrieved successfully"));
    }

    private <T> ResponseEntity<ApiResponse<T>> unauthorized() {
        return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized: Invalid or missing token"));
    }
}
