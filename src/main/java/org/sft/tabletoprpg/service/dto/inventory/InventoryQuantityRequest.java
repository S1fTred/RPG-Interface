package org.sft.tabletoprpg.service.dto.inventory;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record InventoryQuantityRequest(
    UUID itemId,
    @NotNull @Min(0) Integer quantity
) {
}
