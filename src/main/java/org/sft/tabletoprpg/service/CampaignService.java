package org.sft.tabletoprpg.service;

import org.sft.tabletoprpg.domain.CampaignRole;
import org.sft.tabletoprpg.service.dto.campaign.*;

import java.util.List;
import java.util.UUID;

public interface CampaignService {

    CampaignDto createCampaign(UUID gmId, CampaignCreateRequest req);
    CampaignDto updateCampaign(UUID campaignId, UUID requesterId, CampaignUpdateRequest req);
    void deleteCampaign(UUID campaignId, UUID requesterId);

    // Members
    CampaignRoleResult upsertMember(UUID campaignId, UUID userId, CampaignRole role, UUID requesterId);
    CampaignMemberDto updateMemberRole(UUID campaignId, UUID userId, CampaignRole role, UUID requesterId);
    void removeMember(UUID campaignId, UUID userId, UUID requesterId);
    List<CampaignMemberDto> listMembers(UUID campaignId, UUID requesterId);

    // Reads
    List<CampaignDto> findMyCampaigns(UUID gmId);
    List<CampaignDto> findCampaignsByGm_Id(UUID gmId);
    CampaignDto findCampaignById(UUID id);
    public List<CampaignDto> findCampaignsByMember(UUID userId);

}
