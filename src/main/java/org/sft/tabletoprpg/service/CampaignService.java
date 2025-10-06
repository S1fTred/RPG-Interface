package org.sft.tabletoprpg.service;

import org.sft.tabletoprpg.service.dto.campaign.CampaignCreateRequest;
import org.sft.tabletoprpg.service.dto.campaign.CampaignDto;
import org.sft.tabletoprpg.service.dto.campaign.AddMemberRequest;

import java.util.List;
import java.util.UUID;

public interface CampaignService {

    CampaignDto createCampaign(UUID gmId, CampaignCreateRequest req);

    void addMember(UUID campaignId, AddMemberRequest req);

    List<CampaignDto> findCampaignsByGm_Id(UUID gmId);

    CampaignDto findCampaignById(UUID id);
}
