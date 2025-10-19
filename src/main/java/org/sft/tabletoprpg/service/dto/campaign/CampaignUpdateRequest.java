package org.sft.tabletoprpg.service.dto.campaign;

import jakarta.validation.constraints.Size;

public record CampaignUpdateRequest(
    @Size(max=100) String name,
    @Size(max=100) String description
) {
}
