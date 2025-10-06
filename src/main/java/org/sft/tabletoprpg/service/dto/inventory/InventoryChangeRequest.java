package org.sft.tabletoprpg.service.dto.item;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record InventoryChangeRequest(
        @NotNull UUID characterId,
        @NotNull UUID itemId,
        @Min(1) @NotNull int delta
) {
}
