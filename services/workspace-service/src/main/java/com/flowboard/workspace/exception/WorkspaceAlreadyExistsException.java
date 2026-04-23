package com.flowboard.workspace.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class WorkspaceAlreadyExistsException extends CustomException {
    public WorkspaceAlreadyExistsException(String message) {
        super(message, HttpStatus.CONFLICT);
    }
}
