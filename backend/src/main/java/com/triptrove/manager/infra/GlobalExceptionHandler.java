package com.triptrove.manager.infra;

import com.triptrove.manager.application.dto.error.ErrorCodeResponse;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.domain.model.BaseApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.context.MessageSource;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.validation.method.ParameterValidationResult;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import static com.triptrove.manager.domain.model.BaseApiException.ErrorCode;

@Log4j2
@RequiredArgsConstructor
@RestControllerAdvice
public class GlobalExceptionHandler {
    private final MessageSource messageSource;

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseBody
    protected ErrorResponse validationException(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getAllErrors()
                .stream()
                .map(error -> {
                    String fieldName = ((FieldError) error).getField();
                    String errorMessage = error.getDefaultMessage();
                    return fieldName + " = " + errorMessage;
                })
                .collect(Collectors.joining("; ", "{", "}"));

        log.atError().log("Validation failed: '{}'", message);

        return new ErrorResponse(ErrorCodeResponse.BAD_REQUEST, message);
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(HandlerMethodValidationException.class)
    @ResponseBody
    protected ErrorResponse validationException(HandlerMethodValidationException ex) {
        var message = ex.getParameterValidationResults()
                .stream()
                .map(ParameterValidationResult::getResolvableErrors)
                .flatMap(List::stream)
                .map(error -> {
                    String fieldName = (error instanceof ObjectError objectError ?
                            objectError.getObjectName() :
                            ((MessageSourceResolvable) error.getArguments()[0]).getDefaultMessage());

                    return fieldName + " = " + error.getDefaultMessage();
                })
                .collect(Collectors.joining("; ", "{", "}"));

        log.atError().log("Validation failed: '{}'", message);

        return new ErrorResponse(ErrorCodeResponse.BAD_REQUEST, message);
    }

    @ExceptionHandler(BaseApiException.class)
    protected ResponseEntity<ErrorResponse> onBaseApiException(BaseApiException exception) {
        return handleException(exception.getErrorCode(), exception);
    }

    @ExceptionHandler(Exception.class)
    protected ResponseEntity<ErrorResponse> onOtherException(Exception exception) {
        return handleException(ErrorCode.GENERAL, exception);
    }

    private ResponseEntity<ErrorResponse> handleException(ErrorCode errorCode, Throwable exception) {
        String userMessage = messageSource.getMessage("error." + errorCode, new Object[0], "Internal Server Error", Locale.ENGLISH);
        log.error("Error {} - {}: ", errorCode, userMessage, exception);

        return ResponseEntity.status(errorCode.statusCode).body(new ErrorResponse(ErrorCodeResponse.from(errorCode), userMessage));
    }

}
