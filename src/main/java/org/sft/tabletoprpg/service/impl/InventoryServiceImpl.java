package org.sft.tabletoprpg.service.impl;

import lombok.RequiredArgsConstructor;
import org.sft.tabletoprpg.domain.Character;
import org.sft.tabletoprpg.domain.CharacterInventory;
import org.sft.tabletoprpg.domain.Item;
import org.sft.tabletoprpg.repo.CharacterInventoryRepository;
import org.sft.tabletoprpg.repo.CharacterRepository;
import org.sft.tabletoprpg.repo.ItemRepository;
import org.sft.tabletoprpg.service.InventoryService;
import org.sft.tabletoprpg.service.dto.inventory.CharacterInventoryEntryDto;
import org.sft.tabletoprpg.service.dto.inventory.InventoryChangeRequest;
import org.sft.tabletoprpg.service.exception.BadRequestException;
import org.sft.tabletoprpg.service.exception.ForbiddenException;
import org.sft.tabletoprpg.service.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryServiceImpl implements InventoryService {

    private final CharacterInventoryRepository characterInventoryRepository;
    private final CharacterRepository characterRepository;
    private final ItemRepository itemRepository;


    @Override
    public List<CharacterInventoryEntryDto> getInventoryByCharacter(UUID characterId, UUID requesterId) {

        Character character = characterRepository.findById(characterId)
            .orElseThrow(()-> new NotFoundException("Персонаж не найден"));

        UUID ownerId = character.getOwner().getId();
        UUID gmId = character.getCampaign().getGm().getId();
        if (!requesterId.equals(ownerId) && !requesterId.equals(gmId)) {
            throw new ForbiddenException("Нет прав на просмотр инвентаря персонажа");
        }

        return characterInventoryRepository.findByCharacter_Id(characterId)
            .stream()
            .map(this::toDto)
            .toList();
    }

    @Transactional
    @Override
    public void changeQuantity(InventoryChangeRequest req, UUID requesterId) {
        final int delta = req.delta();
        if (delta == 0){
            throw new BadRequestException("Количество не должно быть нулевым");
        }

        Character character = characterRepository.findById(req.characterId())
            .orElseThrow(()-> new NotFoundException("Персонаж не найден"));

        Item item = itemRepository.findById(req.itemId())
            .orElseThrow(()-> new NotFoundException("Предмет не найден не найден"));

        UUID ownerId = character.getOwner().getId();
        UUID gmId = character.getCampaign().getGm().getId();
        if (!requesterId.equals(ownerId) && !requesterId.equals(gmId)) {
            throw new ForbiddenException("Нет прав на просмотр инвентаря персонажа");
        }

        Optional<CharacterInventory> existedCharacterInventory = characterInventoryRepository.findByCharacter_IdAndItem_Id(character.getId(), item.getId());

        if (existedCharacterInventory.isEmpty()) {
            if (delta < 0){
                throw new BadRequestException("Нельзя списывать предмет, которого нет в инвентаре");
            }
            CharacterInventory newCharacterInventory = new  CharacterInventory();
            newCharacterInventory.setItem(item);
            newCharacterInventory.setCharacter(character);
            newCharacterInventory.setQuantity(req.delta());
            characterInventoryRepository.save(newCharacterInventory);
            return;
        }

        CharacterInventory newCharacterInventory = existedCharacterInventory.get();
        int newQty = newCharacterInventory.getQuantity() + delta;
        if (newQty <= 0) {
            throw new BadRequestException("Итоговое количество должно быть больше 0");
        }

        newCharacterInventory.setQuantity(newQty);
        characterInventoryRepository.save(newCharacterInventory);

    }




    //--------------------МАППЕРЫ----------------//
    private CharacterInventoryEntryDto toDto(CharacterInventory characterItem){
        return CharacterInventoryEntryDto.builder()
            .characterId(characterItem.getCharacter().getId())
            .itemId(characterItem.getItem().getId())
            .quantity(characterItem.getQuantity())
            .build();
    }
}
