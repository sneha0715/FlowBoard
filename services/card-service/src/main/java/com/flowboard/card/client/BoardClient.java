package com.flowboard.card.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "board-service")
public interface BoardClient {

    @GetMapping("/boards/{id}/members/{userId}/check")
    ResponseEntity<Boolean> checkMembership(
            @PathVariable("id") Long id,
            @PathVariable("userId") Long userId,
            @RequestHeader("X-Internal-Gateway-Secret") String secret
    );

    @GetMapping("/boards/{id}/members/{userId}/role")
    ResponseEntity<java.util.Map<String, String>> getRole(
            @PathVariable("id") Long id,
            @PathVariable("userId") Long userId,
            @RequestHeader("X-Internal-Gateway-Secret") String secret
    );
}
