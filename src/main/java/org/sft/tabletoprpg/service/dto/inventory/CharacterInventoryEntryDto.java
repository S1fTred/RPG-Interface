package org.sft.tabletoprpg.service.dto.character;

import java.util.UUID;

public record CharacterInventoryEntryDto(
        UUID characterId,
        UUID itemId,
        int quantity
) {
}
