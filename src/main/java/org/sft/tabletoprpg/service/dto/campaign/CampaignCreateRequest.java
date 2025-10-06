package org.sft.tabletoprpg.service.dto.campaign;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CampaignCreateRequest(
        @NotBlank @Size(max=100) String name,
        @Size(max=100) String description
) {
}
