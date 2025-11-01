package org.sft.tabletoprpg.service.dto.inventory;

import lombok.Builder;
import org.sft.tabletoprpg.service.dto.item.ItemDto;

import java.util.UUID;

@Builder
public record CharacterInventoryEntryDto(
        UUID characterId,
        UUID itemId,
        int quantity,
        ItemDto item
) {
}
