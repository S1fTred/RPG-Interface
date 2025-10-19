package org.sft.tabletoprpg.service.dto.campaign;

public record CampaignRoleResult(
    CampaignMemberDto dto,
    boolean created
) {}
