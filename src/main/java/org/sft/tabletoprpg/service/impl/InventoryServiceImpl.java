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
import org.sft.tabletoprpg.service.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final CharacterInventoryRepository characterInventoryRepository;
    private final CharacterRepository characterRepository;
    private final ItemRepository itemRepository;


    @Transactional(readOnly = true)
    @Override
    public List<CharacterInventoryEntryDto> getInventoryByCharacter(UUID characterId) {
        return characterInventoryRepository.findByCharacter_Id(characterId)
            .stream()
            .map(this::toDto)
            .toList();
    }

    @Transactional
    @Override
    public void changeQuantity(InventoryChangeRequest req) {
//        if (req.delta() == 0){
//            throw new BadRequestException("Количество не должно быть нулевым");
//        }
//
//        Character character = characterRepository.findById(req.characterId())
//            .orElseThrow(()-> new NotFoundException("Персонаж не найден"));
//
//        Item item = itemRepository.findById(req.itemId())
//            .orElseThrow(()-> new NotFoundException("Предмет не найден не найден"));
//
//        if (req.delta() <= 0){
//            throw new BadRequestException("Количество не должно быть нулевым или отрицательным");
//        }
//        else {
//            CharacterInventory characterInventory = new CharacterInventory();
//            characterInventory.setCharacter(character);
//            characterInventory.setItem(item);
//            characterInventory.setQuantity(req.delta());
//        }
    }




    //--------------------МАППЕРЫ----------------//
    private CharacterInventoryEntryDto toDto(CharacterInventory characterItem){
        return CharacterInventoryEntryDto.builder()
            .characterId(characterItem.getId())
            .itemId(characterItem.getItem().getId())
            .quantity(characterItem.getQuantity())
            .build();
    }
}
