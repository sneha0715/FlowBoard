package com.flowboard.checklist.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "card-service")
public interface CardClient {

    @GetMapping("/cards/{cardId}/boardId")
    Long getBoardId(
            @PathVariable("cardId") Long cardId,
            @org.springframework.web.bind.annotation.RequestHeader("X-Internal-Gateway-Secret") String secret);
}
