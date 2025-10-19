package org.sft.tabletoprpg.service.dto.campaign;


import jakarta.validation.constraints.NotNull;
import org.sft.tabletoprpg.domain.CampaignRole;

import java.util.UUID;

public record AddMemberRequest(
        @NotNull UUID userId,
        CampaignRole roleInCampaign
) { }
