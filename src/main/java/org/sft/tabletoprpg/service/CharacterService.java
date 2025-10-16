package org.sft.tabletoprpg.service;

import org.sft.tabletoprpg.service.dto.character.CharacterCreateRequest;
import org.sft.tabletoprpg.service.dto.character.CharacterDto;
import org.sft.tabletoprpg.service.dto.character.CharacterUpdateRequest;
import org.sft.tabletoprpg.service.dto.character.HpPatchRequest;

import java.util.List;
import java.util.UUID;

public interface CharacterService {

    CharacterDto createCharacter(CharacterCreateRequest req, UUID requesterId);

    CharacterDto updateCharacter(UUID characterId, CharacterUpdateRequest req, UUID requesterId);

    void deleteCharacter(UUID characterId,  UUID requesterId);

    List<CharacterDto> findCharactersByCampaign_Id(UUID campaignId);

    List<CharacterDto> findCharactersByOwner_Id(UUID ownerId);

    CharacterDto patchHp(UUID characterId,
                         Integer hpParam,
                         HpPatchRequest body,
                         UUID requesterId);

    CharacterDto getById(UUID characterId);

}
