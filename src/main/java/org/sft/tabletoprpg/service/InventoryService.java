package org.sft.tabletoprpg.service;

import org.sft.tabletoprpg.service.dto.inventory.CharacterInventoryEntryDto;
import org.sft.tabletoprpg.service.dto.inventory.InventoryChangeRequest;

import java.util.List;
import java.util.UUID;

public interface InventoryService {

    List<CharacterInventoryEntryDto> getInventoryByCharacter(UUID characterId);
    void changeQuantity(InventoryChangeRequest req);


}
