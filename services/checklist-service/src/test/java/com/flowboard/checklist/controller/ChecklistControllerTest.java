package com.flowboard.checklist.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flowboard.checklist.dto.request.ChecklistRequest;
import com.flowboard.checklist.dto.response.ChecklistResponse;
import com.flowboard.checklist.service.ChecklistService;

@WebMvcTest(controllers = ChecklistResource.class, excludeAutoConfiguration = {
    org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class,
    org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration.class
})
@AutoConfigureMockMvc(addFilters = false)
@org.springframework.test.context.ActiveProfiles("test")
class ChecklistControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ChecklistService checklistService;

    @MockBean(name = "checklistSecurity")
    private Object checklistSecurity;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createChecklist_ReturnsOk() throws Exception {
        ChecklistRequest request = new ChecklistRequest();
        request.setTitle("New Checklist");
        request.setCardId(10L);

        ChecklistResponse response = ChecklistResponse.builder()
                .checklistId(1L)
                .title("New Checklist")
                .build();

        when(checklistService.createChecklist(any())).thenReturn(response);

        mockMvc.perform(post("/checklists")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("New Checklist"));
    }

    @Test
    void getChecklistsByCard_ReturnsOk() throws Exception {
        ChecklistResponse response = ChecklistResponse.builder()
                .checklistId(1L)
                .title("Test Checklist")
                .build();

        when(checklistService.getChecklistsByCard(10L)).thenReturn(List.of(response));

        mockMvc.perform(get("/checklists/card/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].title").value("Test Checklist"));
    }
}
