package org.sft.tabletoprpg.service.dto;

import java.time.Instant;
import java.util.UUID;

public record JournalEntryDto(
        UUID id,
        UUID campaignId,
        UUID authorId,
        String title,
        String content,
        Instant createdAt
) {
}
