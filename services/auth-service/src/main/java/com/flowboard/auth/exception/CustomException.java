package com.flowboard.auth.exception;

import org.springframework.http.HttpStatus;
import lombok.Getter;

/**
 * CustomException — wraps business-level errors with an HTTP status code.
 * Thrown by the service layer and handled by GlobalExceptionHandler.
 */
@Getter
public class CustomException extends RuntimeException {

    private final HttpStatus status;

    public CustomException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }
}
