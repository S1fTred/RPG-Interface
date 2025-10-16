package org.sft.tabletoprpg.service;

import org.sft.tabletoprpg.service.dto.inventory.CharacterInventoryEntryDto;
import org.sft.tabletoprpg.service.dto.inventory.InventoryChangeRequest;

import java.util.List;
import java.util.UUID;

public interface InventoryService {

    List<CharacterInventoryEntryDto> getInventoryByCharacter(UUID characterId, UUID requesterId);

    void changeQuantity(InventoryChangeRequest req, UUID requesterId);

    void giveItem(UUID characterId, UUID itemId, int quantity, UUID requesterId);

    void consumeItem(UUID characterId, UUID itemId, int quantity, UUID requesterId);

    void setQuantity(UUID characterId, UUID itemId, int quantity, UUID requesterId);

    void removeItem(UUID characterId, UUID itemId, UUID requesterId);

}
