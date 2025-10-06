package org.sft.tabletoprpg.service.dto;

import org.sft.tabletoprpg.domain.Atributes;

import java.util.UUID;

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
