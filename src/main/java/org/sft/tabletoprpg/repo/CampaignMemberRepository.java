package org.sft.tabletoprpg.repo;

import org.sft.tabletoprpg.domain.CampaignMember;
import org.sft.tabletoprpg.domain.compositeKeys.CampaignMemberId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CampaignMemberRepository extends JpaRepository<CampaignMember, CampaignMemberId> {

    List<CampaignMember> findByCampaign_Id(UUID campaignId);
    List<CampaignMember> findByUser_Id(UUID userId);
    Optional<CampaignMember> findByCampaign_IdAndUser_Id(UUID campaignId, UUID userId);
    boolean existsByCampaign_IdAndUser_Id(UUID campaignId, UUID userId);
    void deleteByCampaign_IdAndUser_Id(UUID campaignId, UUID userId);
    

}
