package org.sft.tabletoprpg.service.dto.campaign;

import java.util.UUID;

public record CampaignMemberDto(
    UUID userId,
    String username,
    String email,
    String roleInCampaign
) {
}
