package org.sft.tabletoprpg.service.dto.journal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record JournalEntryCreateRequest(

        @NotNull UUID campaignId,
        @NotNull UUID authorId,
        @NotBlank @Size(min=1, max=150) String title,
        @NotBlank String content
) {}
