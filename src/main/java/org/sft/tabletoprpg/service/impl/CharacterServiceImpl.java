package org.sft.tabletoprpg.service.impl;

import lombok.RequiredArgsConstructor;
import org.sft.tabletoprpg.domain.Atributes;
import org.sft.tabletoprpg.domain.Campaign;
import org.sft.tabletoprpg.domain.Character;
import org.sft.tabletoprpg.domain.User;
import org.sft.tabletoprpg.repo.CampaignMemberRepository;
import org.sft.tabletoprpg.repo.CampaignRepository;
import org.sft.tabletoprpg.repo.CharacterRepository;
import org.sft.tabletoprpg.repo.UserRepository;
import org.sft.tabletoprpg.service.CharacterService;
import org.sft.tabletoprpg.service.dto.character.*;
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
public class CharacterServiceImpl implements CharacterService {

    private final CharacterRepository characterRepository;
    private final CampaignRepository campaignRepository;
    private final UserRepository userRepository;
    private final CampaignMemberRepository campaignMemberRepository;


    @Transactional
    @Override
    public CharacterDto createCharacter(UUID campaignId, CharacterCreateRequest req, UUID requesterId) {
        // ---- Нормализация строк
        final String name  = req.name()  == null ? null : req.name().trim();
        final String clazz = req.clazz() == null ? null : req.clazz().trim();
        final String race  = req.race()  == null ? null : req.race().trim();

        if (name == null || name.isEmpty())
            throw new BadRequestException("Имя персонажа не должно быть пустым");
        if (clazz == null || clazz.isEmpty())
            throw new BadRequestException("Класс не должен быть пустым");
        if (race == null || race.isEmpty())
            throw new BadRequestException("Раса не должна быть пустой");

        if (req.level() < 1) {
            throw new BadRequestException("Уровень должен быть ≥ 1");
        }
        if (req.maxHp() < 1) {
            throw new BadRequestException("Максимальный HP должен быть ≥ 1");
        }
        if (req.hp() < 0 || req.hp() > req.maxHp()) {
            throw new BadRequestException("HP должен быть в диапазоне [0, maxHp]");
        }


        Campaign campaign = campaignRepository.findById(campaignId)
            .orElseThrow(() -> new NotFoundException("Кампания не найдена"));


        User owner = userRepository.findById(requesterId)
            .orElseThrow(() -> new NotFoundException("Пользователь (владелец) не найден"));

        // ---- Права: GM кампании или сам владелец
        boolean requesterIsGm    = requesterId.equals(campaign.getGm().getId());
        boolean requesterIsOwner = requesterId.equals(owner.getId());
        if (!requesterIsGm && !requesterIsOwner) {
            throw new ForbiddenException("Нет прав на создание персонажа в этой кампании");
        }


        boolean ownerIsMember = campaignMemberRepository
            .existsByCampaign_IdAndUser_Id(campaignId, owner.getId());
        if (!ownerIsMember) {
            throw new ForbiddenException("Владелец персонажа должен быть участником кампании");
        }

        // Проверка: один пользователь = один персонаж в кампании
        boolean alreadyHasCharacter = characterRepository
            .existsByCampaign_IdAndOwner_Id(campaignId, owner.getId());
        if (alreadyHasCharacter) {
            throw new ConflictException("В этой кампании у вас уже есть персонаж. Один игрок может иметь только одного персонажа в кампании.");
        }

        boolean nameTaken = characterRepository
            .existsByCampaign_IdAndNameIgnoreCase(campaignId, name);
        if (nameTaken) {
            throw new BadRequestException("В этой кампании уже есть персонаж с таким именем");
        }

        Character character = toEntity(req);
        character.setName(name);
        character.setClazz(clazz);
        character.setRace(race);
        character.setOwner(owner);
        character.setCampaign(campaign);

        int hp = character.getHp();
        int maxHp = character.getMaxHp();
        if (hp < 0 || hp > maxHp) {
            throw new BadRequestException("HP должен быть в диапазоне [0, maxHp]");
        }

        characterRepository.save(character);
        return toDto(character);
    }

    @Transactional
    @Override
    public CharacterDto updateCharacter(UUID characterId, CharacterUpdateRequest req, UUID requesterId) {
        Character character = characterRepository.findById(characterId)
            .orElseThrow(() -> new NotFoundException("Персонаж не найден"));

        UUID ownerId = character.getOwner().getId();
        UUID gmId = character.getCampaign() != null ? character.getCampaign().getGm().getId() : null;
        if (!requesterId.equals(ownerId) && (gmId == null || !requesterId.equals(gmId))) {
            throw new ForbiddenException("Нет прав на редактирование этого персонажа");
        }

        // name / clazz / race
        if (req.name() != null) {
            String name = req.name().trim();
            if (name.isEmpty()) throw new BadRequestException("Имя персонажа не должно быть пустым");
            if (character.getCampaign() != null) {
                boolean taken = characterRepository.existsByCampaign_IdAndNameIgnoreCase(
                    character.getCampaign().getId(), name
                );
                if (taken && !name.equalsIgnoreCase(character.getName())) {
                    throw new BadRequestException("В этой кампании уже есть персонаж с таким именем");
                }
            }
            character.setName(name);
        }
        if (req.clazz() != null) {
            String clazz = req.clazz().trim();
            if (clazz.isEmpty()) throw new BadRequestException("Класс не должен быть пустым");
            character.setClazz(clazz);
        }
        if (req.race() != null) {
            String race = req.race().trim();
            if (race.isEmpty()) throw new BadRequestException("Раса не должна быть пустой");
            character.setRace(race);
        }

        // level
        if (req.level() != null) {
            if (req.level() < 1) throw new BadRequestException("Уровень должен быть ≥ 1");
            character.setLevel(req.level());
        }

        // maxHp (hp инвариант)
        if (req.maxHp() != null) {
            if (req.maxHp() < 1) throw new BadRequestException("Максимальный HP должен быть ≥ 1");
            if (character.getHp() > req.maxHp()) {
                throw new BadRequestException("Нельзя уменьшить maxHp ниже текущего HP");
            }
            character.setMaxHp(req.maxHp());
        }

        // attributes (DTO -> domain)
        if (req.attributes() != null) {
            character.setAtributes(mapAttributes(req.attributes())); // поле с опечаткой в домене
        }

        characterRepository.save(character);
        return toDto(character);
    }

    @Transactional
    @Override
    public void deleteCharacter(UUID characterId, UUID requesterId) {
        Character character = characterRepository.findById(characterId)
            .orElseThrow(() -> new NotFoundException("Персонаж не найден"));

        UUID ownerId = character.getOwner().getId();
        UUID gmId = character.getCampaign().getGm().getId();

        if (!requesterId.equals(ownerId) && !requesterId.equals(gmId)) {
            throw new ForbiddenException("Нет прав на удаление персонажа");
        }

        characterRepository.delete(character);
    }

    @Override
    public CharacterDto getById(UUID characterId) {
        Character character = characterRepository.findById(characterId)
            .orElseThrow(() -> new NotFoundException("Персонаж не найден"));
        return toDto(character);
    }

    @Override
    public List<CharacterDto> findCharactersByCampaign_Id(UUID campaignId) {
        return characterRepository.findByCampaign_Id(campaignId)
            .stream()
            .map(this::toDto)
            .toList();
    }

    @Override
    public List<CharacterDto> findCharactersByOwner_Id(UUID ownerId) {
        return characterRepository.findByOwner_Id(ownerId)
            .stream()
            .map(this::toDto)
            .toList();
    }

    @Transactional
    @Override
    public CharacterDto patchHp(UUID characterId, Integer hpParam, HpPatchRequest body, UUID requesterId) {
        Character character = characterRepository.findById(characterId)
            .orElseThrow(() -> new NotFoundException("Персонаж не найден"));

        // Авторизация: владелец или GM
        UUID ownerId = character.getOwner().getId();
        UUID gmId = character.getCampaign().getGm().getId();
        if (!requesterId.equals(ownerId) && !requesterId.equals(gmId)) {
            throw new ForbiddenException("Нет прав на изменение HP этого персонажа");
        }

        // Определяем целевое значение newHp (приоритет: body.set -> body.delta -> hpParam)
        Integer newHp = null;
        if (body != null) {
            if (body.set() != null) {
                newHp = body.set();
            } else if (body.delta() != null) {
                newHp = character.getHp() + body.delta();
            }
        }
        if (newHp == null && hpParam != null) {
            newHp = hpParam;
        }
        if (newHp == null) {
            throw new BadRequestException("Пропущен параметр HP: используйте ?hp= или JSON {\"set\": ...} / {\"delta\": ...}");
        }

        // Валидация диапазона
        if (newHp < 0 || newHp > character.getMaxHp()) {
            throw new BadRequestException("HP должно быть в пределах [0..maxHp]");
        }

        character.setHp(newHp);
        characterRepository.save(character);
        return toDto(character);
    }

    // ------------------------ МАППЕРЫ ------------------------------ //
    private Character toEntity(CharacterCreateRequest req) {
        return Character.builder()
            .name(req.name())
            .clazz(req.clazz())
            .race(req.race())
            .level(req.level())
            .hp(req.hp())
            .maxHp(req.maxHp())
            .atributes(mapAttributes(req.attributes()))
            .build();
    }

    private CharacterDto toDto(Character character) {
        return CharacterDto.builder()
            .id(character.getId())
            .name(character.getName())
            .clazz(character.getClazz())
            .race(character.getRace())
            .level(character.getLevel())
            .hp(character.getHp())
            .maxHp(character.getMaxHp())
            .attributes(mapAttributesDto(character.getAtributes()))
            .build();
    }

    private Atributes mapAttributes(AttributesDto dto) {
        if (dto == null) return null;
        return Atributes.builder()
            .attr_str(dto.strength())
            .attr_agi(dto.dexterity())
            .attr_stam(dto.constitution())
            .attr_int(dto.intelligence())
            .attr_wis(dto.wisdom())
            .attr_cha(dto.charisma())
            .build();
    }

    private AttributesDto mapAttributesDto(Atributes a) {
        if (a == null) return null;
        return new AttributesDto(
            a.getAttr_str(),
            a.getAttr_agi(),
            a.getAttr_stam(),
            a.getAttr_int(),
            a.getAttr_wis(),
            a.getAttr_cha()
        );
    }
}
