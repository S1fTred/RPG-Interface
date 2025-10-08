package org.sft.tabletoprpg.service.dto.journal;

import lombok.Builder;
import org.sft.tabletoprpg.domain.JournalVisibility;

import java.time.Instant;
import java.util.UUID;

@Builder
public record JournalEntryDto(
        UUID id,
        UUID campaignId,
        UUID authorId,
        String type,
        JournalVisibility visibility,
        String title,
        String content,
        String tags,
        Instant createdAt
) {
}
