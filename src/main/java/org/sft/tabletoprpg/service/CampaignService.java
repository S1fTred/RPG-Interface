package org.sft.tabletoprpg.service;

import org.sft.tabletoprpg.service.dto.campaign.CampaignCreateRequest;
import org.sft.tabletoprpg.service.dto.campaign.CampaignDto;
import org.sft.tabletoprpg.service.dto.campaign.AddMemberRequest;

import java.util.List;
import java.util.UUID;

public interface CampaignService {

    CampaignDto createCampaign(UUID gmId, CampaignCreateRequest req);

    void deleteCampaign(UUID gmId, UUID campaignId);

    void addMember(UUID campaignId, UUID gmId, AddMemberRequest req);

    List<CampaignDto> findCampaignsByGm_Id(UUID gmId);

    CampaignDto findCampaignById(UUID id);

}
