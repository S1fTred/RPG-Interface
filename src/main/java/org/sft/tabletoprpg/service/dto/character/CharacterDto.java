package org.sft.tabletoprpg.service.dto.character;

import lombok.Builder;
import org.sft.tabletoprpg.domain.Atributes;

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
        Atributes atributes,
        UUID ownerId,
        UUID campaignId
) {}
