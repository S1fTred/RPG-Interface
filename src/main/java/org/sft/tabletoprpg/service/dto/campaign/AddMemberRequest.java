package org.sft.tabletoprpg.service.dto.campaign_member;


import jakarta.validation.constraints.NotNull;
import org.sft.tabletoprpg.domain.CampaignRole;

import java.util.UUID;

public record AddMemberRequest(
        @NotNull UUID userId,
        @NotNull CampaignRole roleInCampaign
) { }
