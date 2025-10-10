package org.sft.tabletoprpg.service.impl;

import lombok.RequiredArgsConstructor;
import org.sft.tabletoprpg.domain.Item;
import org.sft.tabletoprpg.domain.Role;
import org.sft.tabletoprpg.domain.User;
import org.sft.tabletoprpg.repo.CharacterInventoryRepository;
import org.sft.tabletoprpg.repo.ItemRepository;
import org.sft.tabletoprpg.repo.UserRepository;
import org.sft.tabletoprpg.service.ItemService;
import org.sft.tabletoprpg.service.dto.item.ItemCreateRequest;
import org.sft.tabletoprpg.service.dto.item.ItemDto;
import org.sft.tabletoprpg.service.dto.item.ItemUpdateRequest;
import org.sft.tabletoprpg.service.exception.BadRequestException;
import org.sft.tabletoprpg.service.exception.ConflictException;
import org.sft.tabletoprpg.service.exception.ForbiddenException;
import org.sft.tabletoprpg.service.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ItemServiceImpl implements ItemService {

    private final ItemRepository itemRepository;
    private final CharacterInventoryRepository characterInventoryRepository;
    private final UserRepository userRepository;

    @Transactional
    @Override
    public UUID createItem(ItemCreateRequest req, UUID requesterId) {

        User requester = userRepository.findById(requesterId)
            .orElseThrow(()-> new NotFoundException("Пользователь не найден"));

        if (!requester.getRoles().contains(Role.ADMIN)) {
            throw new ForbiddenException("Только администратор может добавлять предметы");
        }

        String name = req.name() == null ? null : req.name().trim();
        if (name == null || name.isEmpty()) throw new BadRequestException("Название предмета не должно быть пустым");

        if (itemRepository.existsByNameIgnoreCase(name)) throw new NotFoundException("Предмет с таким именем уже существует");

        if (req.weight() != null && req.weight().signum() < 0) {
            throw new BadRequestException("Вес не может быть отрицательным");
        }
        if (req.price() != null && req.price() < 0) {
            throw new BadRequestException("Стоимость не может быть отрицательной");
        }

        Item item = new Item();
        item.setName(name);
        item.setDescription(req.description() == null ? null : req.description().trim());
        item.setWeight(req.weight());
        item.setPrice(req.price());

        itemRepository.save(item);
        return item.getId();
    }

    @Transactional
    @Override
    public void updateItem(UUID itemId, ItemUpdateRequest req, UUID requesterId) {
        User requester = userRepository.findById(requesterId)
            .orElseThrow(()-> new NotFoundException("Пользователь не найден"));

        if (!requester.getRoles().contains(Role.ADMIN)) {
            throw new ForbiddenException("Только администратор может добавлять предметы");
        }

        Item item = itemRepository.findById(itemId)
            .orElseThrow(() -> new NotFoundException("Предмет не найден"));

        if (req.name() != null) {
            String name = req.name().trim();
            if (name.isEmpty())
                throw new BadRequestException("Название не должно быть пустым");
            if (itemRepository.existsByNameIgnoreCase(name) && !name.equalsIgnoreCase(item.getName()))
                  throw new ConflictException("Предмет с таким именем уже существует");
            item.setName(name);
        }
        if (req.description() != null) {
            item.setDescription(req.description().trim());
        }
        if (req.weight() != null) {
            if (req.weight().signum() < 0) throw new BadRequestException("Вес не может быть отрицательным");
            item.setWeight(req.weight());
        }
        if (req.price() != null) {
            if (req.price() < 0) throw new BadRequestException("Стоимость не может быть отрицательной");
            item.setPrice(req.price());
        }

        itemRepository.save(item);
    }

    @Transactional
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

    @Override
    public ItemDto getItem(UUID itemId) {
        Item item = itemRepository.findById(itemId)
            .orElseThrow(()-> new NotFoundException("Предмет не найден"));
        return toDto(item);
    }

    @Override
    public List<ItemDto> findByName(String name) {
        return  itemRepository.findAll()
            .stream()
            .filter(item -> name == null || item.getName().toLowerCase().contains(name.toLowerCase()))
            .map(this::toDto)
            .toList();
    }


    //--------------------МАППЕРЫ---------------------//

    private ItemDto toDto(Item item){
        return ItemDto.builder()
            .id(item.getId())
            .name(item.getName())
            .description(item.getDescription())
            .weight(item.getWeight())
            .price(item.getPrice())
            .build();
    }
}
