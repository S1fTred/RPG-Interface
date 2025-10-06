package org.sft.tabletoprpg.service.dto.campaign;

import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record CampaignDto(
        UUID id,
        String name,
        String description,
        UUID gmId,
        Instant createdAt,
        Instant updatedAt
) {
}
