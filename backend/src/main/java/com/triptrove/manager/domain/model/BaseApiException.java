package com.triptrove.manager.domain.model;

import lombok.Getter;

@Getter
public class BaseApiException extends RuntimeException {
    public enum ErrorCode {
        GENERAL,
        DUPLICATE_NAME(409),
        HAS_CHILDREN(409),
        OBJECT_NOT_FOUND(404);

        public final int statusCode;

        ErrorCode() {
            this(500);
        }

        ErrorCode(int statusCode) {
            this.statusCode = statusCode;
        }
    }

    private final ErrorCode errorCode;

    public BaseApiException(String message, Throwable cause, ErrorCode errorCode) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public BaseApiException(String message, Throwable cause) {
        this(message, cause, ErrorCode.GENERAL);
    }

    public BaseApiException(String message, ErrorCode errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
}