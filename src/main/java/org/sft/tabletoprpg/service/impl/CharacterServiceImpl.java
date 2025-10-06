package org.sft.tabletoprpg.service.impl;

import lombok.RequiredArgsConstructor;
import org.sft.tabletoprpg.domain.Campaign;
import org.sft.tabletoprpg.domain.Character;
import org.sft.tabletoprpg.domain.User;
import org.sft.tabletoprpg.repo.CampaignMemberRepository;
import org.sft.tabletoprpg.repo.CampaignRepository;
import org.sft.tabletoprpg.repo.CharacterRepository;
import org.sft.tabletoprpg.repo.UserRepository;
import org.sft.tabletoprpg.service.CharacterService;
import org.sft.tabletoprpg.service.dto.character.CharacterCreateRequest;
import org.sft.tabletoprpg.service.dto.character.CharacterDto;
import org.sft.tabletoprpg.service.exception.BadRequestException;
import org.sft.tabletoprpg.service.exception.ForbiddenException;
import org.sft.tabletoprpg.service.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CharacterServiceImpl implements CharacterService {

    private final CharacterRepository characterRepository;
    private final CampaignRepository campaignRepository;
    private final UserRepository userRepository;
    private final CampaignMemberRepository campaignMemberRepository;

    @Transactional
    @Override
    public CharacterDto createCharacter(CharacterCreateRequest req) {

        if (req.level() < 1){
            throw new BadRequestException("Уровень должен быть ≥ 1");
        }

        if (req.hp() < 0 || req.hp() > req.maxHp()){
            throw new  BadRequestException("HP должен быть между 0 и максимальным HP");
        }

        User user = userRepository.findById(req.ownerId())
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));

        Campaign campaign = campaignRepository.findById(req.campaignId())
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));

        if (!characterRepository.existsByCampaign_IdAndUser_Id(req.campaignId(), req.ownerId())){
            throw new ForbiddenException("Владелец персонажа должен быть участником кампании");
        }

        Character character = toEntity(req);
        character.setOwner(user);
        character.setCampaign(campaign);
        characterRepository.save(character);

        return toDto(character);
    }

    @Transactional(readOnly = true)
    @Override
    public List<CharacterDto> findCharactersByCampaign_Id(UUID campaignId) {
        return characterRepository.findByCampaign_Id(campaignId).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public List<CharacterDto> findCharactersByOwner_Id(UUID ownerId) {
        return characterRepository.findByOwner_Id(ownerId).stream().map(this::toDto).toList();
    }

    @Transactional
    @Override
    public CharacterDto setHp(UUID characterId, int newHp) {
        Character character = characterRepository.findById(characterId)
            .orElseThrow(()-> new NotFoundException("Персонаж не найден"));

        if (newHp < 0 && newHp > character.getMaxHp()){
            throw new BadRequestException("НР должно быть в пределах [0..maxHp]");
        }

        character.setMaxHp(newHp);

        return toDto(character);
    }



    // ------------------------МАППЕРЫ------------------------------//
    private Character toEntity(CharacterCreateRequest req){
        return Character.builder()
            .name(req.name())
            .clazz(req.clazz())
            .race(req.race())
            .level(req.level())
            .hp(req.hp())
            .maxHp(req.maxHp())
            .atributes(req.atributes())
            .build();
    }

    private CharacterDto toDto(Character character){
        return CharacterDto.builder()
            .id(character.getId())
            .name(character.getName())
            .clazz(character.getClazz())
            .race(character.getRace())
            .level(character.getLevel())
            .hp(character.getHp())
            .maxHp(character.getMaxHp())
            .atributes(character.getAtributes())
            .build();
    }
}
