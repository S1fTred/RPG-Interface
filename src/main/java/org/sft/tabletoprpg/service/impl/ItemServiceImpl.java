package org.sft.tabletoprpg.service.impl;

import lombok.RequiredArgsConstructor;
import org.sft.tabletoprpg.domain.Item;
import org.sft.tabletoprpg.domain.Role;
import org.sft.tabletoprpg.domain.User;
import org.sft.tabletoprpg.repo.CharacterInventoryRepository;
import org.sft.tabletoprpg.repo.ItemRepository;
import org.sft.tabletoprpg.repo.UserRepository;
import org.sft.tabletoprpg.service.ItemService;
import org.sft.tabletoprpg.service.exception.ConflictException;
import org.sft.tabletoprpg.service.exception.ForbiddenException;
import org.sft.tabletoprpg.service.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ItemServiceImpl implements ItemService {

    private final ItemRepository itemRepository;
    private final CharacterInventoryRepository characterInventoryRepository;
    private final UserRepository userRepository;

    @Override
    public void deleteItem(UUID itemId, UUID requesterId) {

        Item item = itemRepository.findById(itemId)
            .orElseThrow(()-> new NotFoundException("Предмет не найден"));

        User requester = userRepository.findById(requesterId)
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));

        var roles = requester.getRoles();
        boolean canDelete = roles.contains(Role.ADMIN) || roles.contains(Role.GAME_MASTER);
        if (!canDelete) {
            throw new ForbiddenException("Недостаточно прав для удаления предмета");
        }

        if (characterInventoryRepository.existsByItem_Id(itemId)) {
            throw new ConflictException("Нельзя удалить предмет: он используется в инвентарях персонажей");
        }

        itemRepository.delete(item);

    }


}
