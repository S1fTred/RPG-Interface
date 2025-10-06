package org.sft.tabletoprpg.service.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        List<FieldErrorItem> errors
) {
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record FieldErrorItem(String field, String message) {}
}
