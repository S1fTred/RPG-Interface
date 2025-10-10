package org.sft.tabletoprpg.service.dto.item;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record ItemCreateRequest(
    @NotBlank String name,
    String description,
    @PositiveOrZero @Digits(integer=6, fraction=2) BigDecimal weight,
    @PositiveOrZero Integer price
) {}
