package org.sft.tabletoprpg.service;

import java.util.UUID;

public interface ItemService {
    void deleteItem(UUID itemId, UUID requesterId);
}
