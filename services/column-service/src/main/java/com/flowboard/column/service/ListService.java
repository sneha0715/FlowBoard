package com.flowboard.column.service;

import com.flowboard.column.dto.request.ListRequest;
import com.flowboard.column.dto.response.ListResponse;

import java.util.List;

public interface ListService {
    ListResponse createList(ListRequest request);
    ListResponse getListById(Long listId);
    List<ListResponse> getListsByBoard(Long boardId);
    ListResponse updateList(Long listId, ListRequest request);
    void reorderLists(Long boardId, List<Long> listIds);
    void archiveList(Long listId);
    void unarchiveList(Long listId);
    void deleteList(Long listId);
    ListResponse moveList(Long listId, Long newBoardId);
    List<ListResponse> getArchivedLists(Long boardId);
    Long getBoardIdByListId(Long listId);
}
