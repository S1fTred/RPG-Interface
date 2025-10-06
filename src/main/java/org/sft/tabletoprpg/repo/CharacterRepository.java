package org.sft.tabletoprpg.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CharacterRepository extends JpaRepository<org.sft.tabletoprpg.domain.Character, UUID> {

    List<org.sft.tabletoprpg.domain.Character> findByOwner_Id(UUID ownerId);
    List<org.sft.tabletoprpg.domain.Character> findByCampaign_Id(UUID campaignId);
    boolean existsByCampaign_IdAndName(UUID campaignId, String name);
    boolean existsByIdAndOwner_Id(UUID characterId, UUID ownerId);
    boolean existsByIdAndCampaign_Id(UUID characterId, UUID campaignId);
    boolean existsByCampaign_IdAndUser_Id(UUID campaignId, UUID ownerID);
    Optional<org.sft.tabletoprpg.domain.Character> findByIdAndCampaign_Id(UUID characterId, UUID campaignId);
}
