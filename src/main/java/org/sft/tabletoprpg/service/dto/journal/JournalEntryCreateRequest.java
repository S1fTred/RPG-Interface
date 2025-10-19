package org.sft.tabletoprpg.service.dto.journal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.sft.tabletoprpg.domain.JournalVisibility;

import java.util.UUID;

public record JournalEntryCreateRequest(
        @NotBlank @Size(max = 50) String type,
        @NotNull JournalVisibility visibility,
        @NotBlank @Size(min=1, max=150) String title,
        @NotBlank String content,
        String tags
) {}
