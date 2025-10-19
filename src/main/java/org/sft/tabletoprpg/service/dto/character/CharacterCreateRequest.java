package org.sft.tabletoprpg.service.dto.character;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record  CharacterCreateRequest(
    @NotBlank String name,
    @NotBlank String clazz,
    @NotBlank String race,
    @Min(1) @Max(20) int level,
    @Min(0) int hp,
    @Min(1) @Max(999) int maxHp,
    @Valid @NotNull AttributesDto attributes
) {}
