package org.sft.tabletoprpg.service.dto.journal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.sft.tabletoprpg.domain.JournalVisibility;

public record JournalEntryUpdateRequest(
        @Size(max = 50) String type,
        JournalVisibility visibility,
        @Size(min=1, max=150) String title,
        String content,
        String tags
) {}
