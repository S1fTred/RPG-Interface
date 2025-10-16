package org.sft.tabletoprpg.service.dto.character;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record AttributesDto(
    @Min(1) @Max(30) int strength,
    @Min(1) @Max(30) int dexterity,
    @Min(1) @Max(30) int constitution,
    @Min(1) @Max(30) int intelligence,
    @Min(1) @Max(30) int wisdom,
    @Min(1) @Max(30) int charisma
) {
}
