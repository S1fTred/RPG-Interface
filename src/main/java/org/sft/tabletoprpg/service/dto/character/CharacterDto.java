package org.sft.tabletoprpg.service.dto.character;

import lombok.Builder;

import java.util.UUID;

@Builder
public record CharacterDto(
        UUID id,
        String name,
        String clazz,
        String race,
        int level,
        int hp,
        int maxHp,
        AttributesDto attributes,
        UUID ownerId,
        UUID campaignId
) {}
