package org.sft.tabletoprpg.service;

import org.sft.tabletoprpg.service.dto.item.ItemCreateRequest;
import org.sft.tabletoprpg.service.dto.item.ItemDto;
import org.sft.tabletoprpg.service.dto.item.ItemUpdateRequest;

import java.util.List;
import java.util.UUID;

public interface ItemService {
    ItemDto createItem(ItemCreateRequest req, UUID requesterId);  // ADMIN
    void updateItem(UUID itemId, ItemUpdateRequest req, UUID requesterId); // ADMIN
    void deleteItem(UUID itemId, UUID requesterId); // ADMIN
    ItemDto getItem(UUID itemId);
    List<ItemDto> findByName(String q);
}
