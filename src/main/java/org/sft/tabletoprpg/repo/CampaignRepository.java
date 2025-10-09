package org.sft.tabletoprpg.repo;

import org.sft.tabletoprpg.domain.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CampaignRepository extends JpaRepository<Campaign, UUID> {

    List<Campaign> findByGm_Id(UUID gmUserId);
    boolean existsByGm_Id(UUID gmId);
    boolean existsByIdAndGm_Id(UUID campaignId, UUID gmUserId);

}
