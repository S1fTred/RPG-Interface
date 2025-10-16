package org.sft.tabletoprpg.service;

import org.sft.tabletoprpg.service.dto.campaign.*;

import java.util.List;
import java.util.UUID;

public interface CampaignService {

    CampaignDto createCampaign(UUID gmId, CampaignCreateRequest req);

    CampaignDto updateCampaign(UUID campaignId, UUID requesterId, CampaignUpdateRequest req);

    void deleteCampaign(UUID campaignId, UUID requesterId);

    CampaignDto findCampaignById(UUID id);

    List<CampaignDto> findMyCampaigns(UUID gmId);

    List<CampaignDto> findCampaignsByGm_Id(UUID gmId);

    void addMember(UUID campaignId, UUID requesterId, AddMemberRequest req);

    List<CampaignMemberDto> listMembers(UUID campaignId, UUID requesterId);

    void removeMember(UUID campaignId, UUID userId, UUID requesterId);

}
