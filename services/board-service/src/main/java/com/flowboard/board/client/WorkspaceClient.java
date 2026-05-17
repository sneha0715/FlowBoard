package com.flowboard.board.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "workspace-service")
public interface WorkspaceClient {

    @GetMapping("/workspaces/{workspaceId}/members/{userId}/role")
    java.util.Map<String, String> getMemberRole(
            @PathVariable("workspaceId") int workspaceId, 
            @PathVariable("userId") int userId,
            @RequestHeader("X-Internal-Gateway-Secret") String secret);
}
