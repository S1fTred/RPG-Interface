package org.sft.tabletoprpg.service.dto.inventory;

import lombok.Builder;

import java.util.UUID;

@Builder
public record CharacterInventoryEntryDto(
        UUID characterId,
        UUID itemId,
        int quantity
) {
}
