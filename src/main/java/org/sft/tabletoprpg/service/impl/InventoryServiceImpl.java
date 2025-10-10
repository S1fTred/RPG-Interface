package org.sft.tabletoprpg.service.impl;

import lombok.RequiredArgsConstructor;
import org.sft.tabletoprpg.domain.Character;
import org.sft.tabletoprpg.domain.CharacterInventory;
import org.sft.tabletoprpg.domain.Item;
import org.sft.tabletoprpg.domain.compositeKeys.CharacterInventoryId;
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

        if (delta > 0){
            if (!requesterId.equals(gmId)){
                throw new ForbiddenException("Только ГМ может выдавать предметы персонажу");
            }

            Optional<CharacterInventory> existedCharacterInventory = characterInventoryRepository.findByCharacter_IdAndItem_Id(character.getId(), item.getId());

            if (existedCharacterInventory.isEmpty()) {
                var entry = new CharacterInventory();
                entry.setCharacter(character);
                entry.setItem(item);
                entry.setQuantity(delta);
                entry.setId(new CharacterInventoryId(character.getId(), item.getId()));
                characterInventoryRepository.save(entry);
            } else {
                var entry = existedCharacterInventory.get();
                entry.setQuantity(entry.getQuantity() + delta);
                characterInventoryRepository.save(entry);
            }
            return;
        }

        if (!requesterId.equals(ownerId)) {
            throw new ForbiddenException("Только владелец персонажа может расходовать/удалять предметы");
        }

        var entry = characterInventoryRepository.findByCharacter_IdAndItem_Id(character.getId(), item.getId())
            .orElseThrow(() -> new NotFoundException("Этого предмета нет в инвентаре"));

        int newQty = entry.getQuantity() + delta; // delta отрицательная
        if (newQty < 0) {
            throw new BadRequestException("Нельзя списать больше, чем есть");
        } else if (newQty == 0) {
            characterInventoryRepository.delete(entry);
        } else {
            entry.setQuantity(newQty);
            characterInventoryRepository.save(entry);
        }
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
