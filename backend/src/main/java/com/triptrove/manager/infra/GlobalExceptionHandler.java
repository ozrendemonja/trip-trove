package com.triptrove.manager.infra;

import com.triptrove.manager.application.dto.error.ErrorCodeResponse;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.domain.model.BaseApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.TypeMismatchException;
import org.springframework.context.MessageSource;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.Arrays;
import java.util.Locale;
import java.util.stream.Collectors;

@Log4j2
@RequiredArgsConstructor
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {
    private static final String DEFAULT_SERVER_ERROR_MESSAGE = "An unexpected server error occurred. Please try again later.";

    private final MessageSource messageSource;

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException exception,
                                                                  HttpHeaders headers, HttpStatusCode status,
                                                                  WebRequest request) {
        String message = exception.getCause() == null
                ? "Request body is required."
                : "Request body must contain valid JSON with the expected field types.";

        return handleExceptionInternal(exception, new ErrorResponse(ErrorCodeResponse.BAD_REQUEST, message), headers, status, request);
    }

    @Override
    protected ResponseEntity<Object> handleTypeMismatch(TypeMismatchException exception, HttpHeaders headers,
                                                        HttpStatusCode status, WebRequest request) {
        String name = exception instanceof MethodArgumentTypeMismatchException argumentException
                ? argumentException.getName() : exception.getPropertyName();
        Class<?> requiredType = exception.getRequiredType();
        String expected = requiredType == null ? "a value of the expected type"
                : requiredType.isEnum() ? "one of " + Arrays.toString(requiredType.getEnumConstants())
                : "a valid " + requiredType.getSimpleName() + " value";
        String message = (name == null ? "Request value" : "Parameter '" + name + "'") + " must be " + expected + ".";

        return handleExceptionInternal(exception, new ErrorResponse(ErrorCodeResponse.BAD_REQUEST, message), headers, status, request);
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
                                                                  HttpHeaders headers, HttpStatusCode status,
                                                                  WebRequest request) {
        String message = ex.getBindingResult().getAllErrors()
                .stream()
                .map(error -> {
                    String fieldName = error instanceof FieldError fieldError ? fieldError.getField() : error.getObjectName();
                    String errorMessage = error.getDefaultMessage();
                    return fieldName + " = " + errorMessage;
                })
                .collect(Collectors.joining("; ", "{", "}"));

        log.atWarn().log("Validation failed: '{}'", message);

        return handleExceptionInternal(ex, new ErrorResponse(ErrorCodeResponse.BAD_REQUEST, message), headers, status, request);
    }

    @Override
    protected ResponseEntity<Object> handleHandlerMethodValidationException(HandlerMethodValidationException ex,
                                                                            HttpHeaders headers, HttpStatusCode status,
                                                                            WebRequest request) {
        if (ex.isForReturnValue()) {
            return handleExceptionInternal(ex, null, headers, status, request);
        }

        var message = ex.getParameterValidationResults()
                .stream()
                .flatMap(result -> result.getResolvableErrors().stream().map(error -> {
                    String fieldName = error instanceof FieldError fieldError ? fieldError.getField()
                            : error instanceof ObjectError objectError ? objectError.getObjectName()
                            : result.getMethodParameter().getParameterName();
                    if (fieldName == null) {
                        fieldName = "argument[" + result.getMethodParameter().getParameterIndex() + "]";
                    }

                    return fieldName + " = " + error.getDefaultMessage();
                }))
                .collect(Collectors.joining("; ", "{", "}"));

        log.atWarn().log("Validation failed: '{}'", message);

        return handleExceptionInternal(ex, new ErrorResponse(ErrorCodeResponse.BAD_REQUEST, message), headers, status, request);
    }

    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception exception, Object body, HttpHeaders headers,
                                                             HttpStatusCode status, WebRequest request) {
        if (status.is5xxServerError()) {
            log.error("Request failed with HTTP {}", status.value(), exception);
        }
        return super.handleExceptionInternal(exception, body, headers, status, request);
    }

    @Override
    protected ResponseEntity<Object> createResponseEntity(Object body, HttpHeaders headers, HttpStatusCode status,
                                                          WebRequest request) {
        ErrorResponse response;
        if (status.is5xxServerError()) {
            response = new ErrorResponse(ErrorCodeResponse.INTERNAL_SERVER_ERROR, DEFAULT_SERVER_ERROR_MESSAGE);
        } else if (body instanceof ErrorResponse errorResponse) {
            response = errorResponse;
        } else {
            String message = body instanceof ProblemDetail problem ? problem.getDetail() : null;
            if (message == null || message.isBlank()) {
                HttpStatus httpStatus = HttpStatus.resolve(status.value());
                message = httpStatus == null ? "Request could not be processed." : httpStatus.getReasonPhrase();
            }
            ErrorCodeResponse errorCode = status.value() == HttpStatus.NOT_FOUND.value()
                    ? ErrorCodeResponse.OBJECT_NOT_FOUND : ErrorCodeResponse.BAD_REQUEST;
            response = new ErrorResponse(errorCode, message);
        }

        return ResponseEntity.status(status).headers(headers).contentType(MediaType.APPLICATION_JSON).body(response);
    }

    @ExceptionHandler(BaseApiException.class)
    protected ResponseEntity<ErrorResponse> onBaseApiException(BaseApiException exception) {
        var responseCode = ErrorCodeResponse.from(exception.getErrorCode());
        var userMessage = userMessage(exception);
        log.error("Domain error {} - {}: ", exception.getErrorCode(), userMessage, exception);

        return ResponseEntity.status(httpStatus(responseCode)).contentType(MediaType.APPLICATION_JSON)
                .body(new ErrorResponse(responseCode, userMessage));
    }

    @ExceptionHandler(Exception.class)
    protected ResponseEntity<ErrorResponse> onOtherException(Exception exception) {
        log.error("Unexpected request failure", exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).contentType(MediaType.APPLICATION_JSON)
                .body(new ErrorResponse(ErrorCodeResponse.INTERNAL_SERVER_ERROR, DEFAULT_SERVER_ERROR_MESSAGE));
    }

    private String userMessage(BaseApiException exception) {
        return messageSource.getMessage("error." + exception.getErrorCode(),
                exception.getContext().stream().map(String::valueOf).toArray(),
                "Request could not be processed due to a domain constraint.", Locale.ENGLISH);
    }

    private HttpStatus httpStatus(ErrorCodeResponse errorCode) {
        return switch (errorCode) {
            case NAME_CONFLICT, ISO_CODE_CONFLICT, RESOURCE_HAS_DEPENDENCIES,
                 ATTRACTION_ALREADY_ADDED_TO_TRIP -> HttpStatus.CONFLICT;
            case OBJECT_NOT_FOUND -> HttpStatus.NOT_FOUND;
            case BAD_REQUEST -> HttpStatus.BAD_REQUEST;
            case INTERNAL_SERVER_ERROR -> HttpStatus.INTERNAL_SERVER_ERROR;
        };
    }
}
