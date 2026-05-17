package com.flowboard.notification.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import com.flowboard.notification.dto.response.NotificationResponse;
import com.flowboard.notification.mapper.NotificationMapper;
import com.flowboard.notification.service.NotificationService;

@WebMvcTest(controllers = NotificationResource.class, excludeAutoConfiguration = {
    org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class,
    org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration.class
})
@AutoConfigureMockMvc(addFilters = false)
@org.springframework.test.context.ActiveProfiles("test")
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NotificationService notificationService;

    @MockBean
    private NotificationMapper notificationMapper;

    @Test
    void getByRecipient_ReturnsOk() throws Exception {
        NotificationResponse response = NotificationResponse.builder()
                .notificationId(1L)
                .message("Test Notify")
                .build();

        when(notificationService.getByRecipient(100L)).thenReturn(List.of(response));

        mockMvc.perform(get("/notifications/recipient/100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].message").value("Test Notify"));
    }

    @Test
    void markAsRead_ReturnsOk() throws Exception {
        mockMvc.perform(put("/notifications/1/read"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
