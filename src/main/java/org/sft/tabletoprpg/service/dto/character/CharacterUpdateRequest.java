package org.sft.tabletoprpg.service.dto.character;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record CharacterUpdateRequest(
    String name,
    String clazz,
    String race,
    @Min(1) @Max(20) Integer level,
    @Valid AttributesDto attributes,
    @Min(1) @Max(999) Integer maxHp
) {
}
