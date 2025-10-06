package org.sft.tabletoprpg.service.dto.journal;

import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record JournalEntryDto(
        UUID id,
        UUID campaignId,
        UUID authorId,
        String title,
        String content,
        Instant createdAt
) {
}
