package org.sft.tabletoprpg.service.dto.inventory;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record InventoryChangeRequest(
        @NotNull UUID characterId,
        @NotNull UUID itemId,
        @Min(1) @NotNull int delta
) {
}
