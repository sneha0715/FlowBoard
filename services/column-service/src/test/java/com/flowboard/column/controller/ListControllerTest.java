package com.flowboard.column.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flowboard.column.dto.request.ListRequest;
import com.flowboard.column.dto.response.ListResponse;
import com.flowboard.column.service.ListService;

@WebMvcTest(ListResource.class)
@AutoConfigureMockMvc(addFilters = false)
class ListControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ListService listService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createList_ReturnsOk() throws Exception {
        ListRequest request = new ListRequest();
        request.setName("New List");
        request.setBoardId(10L);

        ListResponse response = new ListResponse();
        response.setListId(1L);
        response.setName("New List");

        when(listService.createList(any())).thenReturn(response);

        mockMvc.perform(post("/columns")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("New List"));
    }

    @Test
    void getListById_ReturnsOk() throws Exception {
        ListResponse response = new ListResponse();
        response.setListId(1L);
        response.setName("Test List");

        when(listService.getListById(1L)).thenReturn(response);

        mockMvc.perform(get("/columns/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Test List"));
    }
}

