package org.sft.tabletoprpg.service;

import org.sft.tabletoprpg.service.dto.character.CharacterCreateRequest;
import org.sft.tabletoprpg.service.dto.character.CharacterDto;

import java.util.List;
import java.util.UUID;

public interface CharacterService {

    CharacterDto createCharacter(CharacterCreateRequest req);

    List<CharacterDto> findCharactersByCampaign_Id(UUID campaignId);

    List<CharacterDto> findCharactersByOwner_Id(UUID ownerId);

    CharacterDto setHp(UUID characterId, int newHp);
}
