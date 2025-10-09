package org.sft.tabletoprpg.service.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private final Clock clock;

    @Autowired
    public GlobalExceptionHandler(Clock clock) {
        this.clock = clock;
    }

    //---------------Доменные исключения-------------------//

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(NotFoundException ex, HttpServletRequest req) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), req, null);
    }


    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiErrorResponse> handleConflict(ConflictException ex, HttpServletRequest req) {
        return build(HttpStatus.CONFLICT, ex.getMessage(), req, null);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiErrorResponse> handleForbidden(ForbiddenException ex, HttpServletRequest req) {
        return build(HttpStatus.FORBIDDEN, ex.getMessage(), req, null);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiErrorResponse> handleBadRequest(BadRequestException ex, HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage(), req, null);
    }


    // ---------- Валидация (@Valid) ----------

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodArgNotValid(MethodArgumentNotValidException ex,
                                                                    HttpServletRequest req) {
        List<ApiErrorResponse.FieldErrorItem> items = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fe -> new ApiErrorResponse.FieldErrorItem(
                        fe.getField(),
                        fe.getDefaultMessage() != null
                                ? fe.getDefaultMessage()
                                : (fe.getCode() != null ? fe.getCode() : "Ошибка валидации")
                ))
                .toList();

        String msg = "Validation failed: " + items.size() + " ошибка(и)";
        return build(HttpStatus.BAD_REQUEST, msg, req, items);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraintViolation(ConstraintViolationException ex,
                                                                      HttpServletRequest req) {
        List<ApiErrorResponse.FieldErrorItem> items = ex.getConstraintViolations()
                .stream()
                .map(this::toFieldItem)
                .toList();
        String msg = "Нарушение ограничений: " + items.size() + " error(s)";
        return build(HttpStatus.BAD_REQUEST, msg, req, items);
    }

    private ApiErrorResponse.FieldErrorItem toFieldItem(ConstraintViolation<?> v) {
        String path = v.getPropertyPath() != null ? v.getPropertyPath().toString() : null;
        return new ApiErrorResponse.FieldErrorItem(path, v.getMessage());
    }

    // ---------- Частые техошибки входа ----------

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleUnreadable(HttpMessageNotReadableException ex, HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, "Испорченный запрос JSON", req, null);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiErrorResponse> handleMissingParam(MissingServletRequestParameterException ex,
                                                               HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, "Пропущен требуемый параметр: " + ex.getParameterName(), req, null);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex,
                                                                     HttpServletRequest req) {
        return build(HttpStatus.METHOD_NOT_ALLOWED, ex.getMessage(), req, null);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiErrorResponse> handleMediaType(HttpMediaTypeNotSupportedException ex,
                                                            HttpServletRequest req) {
        return build(HttpStatus.UNSUPPORTED_MEDIA_TYPE, ex.getMessage(), req, null);
    }

    // ---------- Нарушения целостности БД (unique/foreign key) ----------

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex,
                                                                HttpServletRequest req) {
        // Не раскрываем внутренние детали SQL — возвращаем 409.
        return build(HttpStatus.CONFLICT, "Нарушение целостности данных", req, null);
    }

    // ---------- Fallback ----------

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleAny(Exception ex, HttpServletRequest req) {
        // На проде здесь обычно логируем stacktrace. Сообщение отдаём общее.
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Внутренняя ошибка сервера", req, null);
    }


    // ---------- Вспомогательное ----------

    private ResponseEntity<ApiErrorResponse> build(HttpStatus status,
                                                   String message,
                                                   HttpServletRequest req,
                                                   List<ApiErrorResponse.FieldErrorItem> errors) {
        ApiErrorResponse body = new ApiErrorResponse(
                Instant.now(clock),
                status.value(),
                status.getReasonPhrase(),
                message,
                req.getRequestURI(),
                (errors == null || errors.isEmpty()) ? null : errors
        );
        return ResponseEntity.status(status).body(body);
    }
}
