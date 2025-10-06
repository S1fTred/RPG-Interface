package org.sft.tabletoprpg.service.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.sft.tabletoprpg.domain.Atributes;

import java.util.UUID;

public record  CharacterCreateRequest(
        @NotBlank String name,
        @NotBlank String clazz,
        @NotBlank String race,
        @Min(1) int level,
        @Min(10) int hp,
        @Max(10) int maxHp,
        @Valid @NotNull Atributes atributes,
        @NotNull UUID ownerId,
        @NotNull UUID campaignId
) {}
