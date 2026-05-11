package com.flowboard.workspace.controller;

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
import com.flowboard.workspace.dto.request.WorkspaceRequest;
import com.flowboard.workspace.dto.response.WorkspaceResponse;
import com.flowboard.workspace.service.WorkspaceService;
import com.flowboard.workspace.mapper.WorkspaceMemberMapper;

@WebMvcTest(controllers = WorkspaceController.class, excludeAutoConfiguration = {
    org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class,
    org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration.class
})
@AutoConfigureMockMvc(addFilters = false)
@org.springframework.test.context.ActiveProfiles("test")
class WorkspaceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private WorkspaceService workspaceService;

    @MockBean
    private WorkspaceMemberMapper workspaceMemberMapper;

    @MockBean(name = "workspaceSecurity")
    private com.flowboard.workspace.security.WorkspaceSecurity workspaceSecurity;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createWorkspace_ReturnsOk() throws Exception {
        WorkspaceRequest request = new WorkspaceRequest();
        request.setName("New WS");
        request.setOwnerId(10);

        WorkspaceResponse response = new WorkspaceResponse();
        response.setWorkspaceId(1);
        response.setName("New WS");

        when(workspaceService.createWorkspace(any())).thenReturn(response);

        mockMvc.perform(post("/workspaces/create")
                .requestAttr("userId", 10L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("New WS"));
    }

    @Test
    void getById_ReturnsOk() throws Exception {
        WorkspaceResponse response = new WorkspaceResponse();
        response.setWorkspaceId(1);
        response.setName("Test WS");

        when(workspaceService.getById(1)).thenReturn(response);

        mockMvc.perform(get("/workspaces/1")
                .requestAttr("userId", 10L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Test WS"));
    }
}
