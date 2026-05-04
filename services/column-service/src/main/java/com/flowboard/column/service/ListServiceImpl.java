package com.flowboard.column.service;

import com.flowboard.column.dto.request.ListRequest;
import com.flowboard.column.dto.response.ListResponse;
import com.flowboard.column.exception.ResourceNotFoundException;
import com.flowboard.column.mapper.ListMapper;
import com.flowboard.column.model.TaskList;
import com.flowboard.column.repository.ListRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class ListServiceImpl implements ListService {

    private final ListRepository listRepository;
    private final ListMapper listMapper;

    @Override
    @Transactional
    public ListResponse createList(ListRequest request) {
        TaskList taskList = listMapper.toEntity(request);
        if (taskList.getPosition() == null) {
            Integer maxPos = listRepository.findMaxPositionByBoardId(request.getBoardId());
            taskList.setPosition(maxPos == null ? 0 : maxPos + 1);
        }
        ListResponse response = listMapper.toResponse(listRepository.save(taskList));
        log.info("List created: id={}, boardId={}", response.getListId(), request.getBoardId());
        return response;
    }

    @Override
    public ListResponse getListById(Long listId) {
        return listRepository.findById(listId)
                .map(listMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("List not found with id: " + listId));
    }

    @Override
    public List<ListResponse> getListsByBoard(Long boardId) {
        return listRepository.findByBoardIdOrderByPosition(boardId).stream()
                .filter(list -> !list.isArchived())
                .map(listMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ListResponse updateList(Long listId, ListRequest request) {
        TaskList taskList = listRepository.findById(listId)
                .orElseThrow(() -> new ResourceNotFoundException("List not found with id: " + listId));
        listMapper.updateEntityFromRequest(request, taskList);
        ListResponse response = listMapper.toResponse(listRepository.save(taskList));
        log.info("List updated: id={}", listId);
        return response;
    }

    @Override
    @Transactional
    public void reorderLists(Long boardId, List<Long> listIds) {
        List<TaskList> lists = listRepository.findByBoardId(boardId);
        Map<Long, TaskList> listMap = lists.stream()
                .collect(Collectors.toMap(TaskList::getListId, Function.identity()));

        IntStream.range(0, listIds.size()).forEach(i -> {
            Long id = listIds.get(i);
            if (listMap.containsKey(id)) {
                listMap.get(id).setPosition(i);
            }
        });

        listRepository.saveAll(lists);
    }

    @Override
    @Transactional
    public void archiveList(Long listId) {
        TaskList taskList = listRepository.findById(listId)
                .orElseThrow(() -> new ResourceNotFoundException("List not found with id: " + listId));
        taskList.setArchived(true);
        listRepository.save(taskList);
        log.info("List archived: id={}", listId);
    }

    @Override
    @Transactional
    public void unarchiveList(Long listId) {
        TaskList taskList = listRepository.findById(listId)
                .orElseThrow(() -> new ResourceNotFoundException("List not found with id: " + listId));
        taskList.setArchived(false);
        listRepository.save(taskList);
        log.info("List unarchived: id={}", listId);
    }

    @Override
    @Transactional
    public void deleteList(Long listId) {
        if (!listRepository.existsById(listId)) {
            throw new ResourceNotFoundException("List not found with id: " + listId);
        }
        listRepository.deleteById(listId);
        log.info("List deleted: id={}", listId);
    }

    @Override
    @Transactional
    public ListResponse moveList(Long listId, Long newBoardId) {
        TaskList taskList = listRepository.findById(listId)
                .orElseThrow(() -> new ResourceNotFoundException("List not found with id: " + listId));
        
        taskList.setBoardId(newBoardId);
        // Set to end of new board
        Integer maxPos = listRepository.findMaxPositionByBoardId(newBoardId);
        taskList.setPosition(maxPos == null ? 0 : maxPos + 1);
        
        return listMapper.toResponse(listRepository.save(taskList));
    }

    @Override
    public List<ListResponse> getArchivedLists(Long boardId) {
        return listRepository.findByBoardIdAndIsArchived(boardId, true).stream()
                .map(listMapper::toResponse)
                .collect(Collectors.toList());
    }
}
