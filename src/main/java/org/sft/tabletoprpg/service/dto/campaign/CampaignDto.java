package org.sft.tabletoprpg.service.dto;

import java.time.Instant;
import java.util.UUID;

public record CampaignDto(
        UUID id,
        String name,
        String description,
        UUID gmId,
        Instant createdAt,
        Instant updatedAt
) {
}
