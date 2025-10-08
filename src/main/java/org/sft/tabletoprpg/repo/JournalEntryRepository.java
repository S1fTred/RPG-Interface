package org.sft.tabletoprpg.repo;

import org.sft.tabletoprpg.domain.JournalEntry;
import org.sft.tabletoprpg.domain.JournalVisibility;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JournalEntryRepository extends JpaRepository<JournalEntry, UUID> {

    List<JournalEntry> findByCampaign_IdOrderByCreatedAtDesc(UUID campaignId);

    List<JournalEntry> findByCampaignIdAndVisibilityOrderByCreatedAtDesc(UUID campaignId, JournalVisibility visibility);

    List<JournalEntry> findByCampaignIdAndTypeIgnoreCaseOrderByCreatedAtDesc(UUID campaignId, String type);

    List<JournalEntry> findByCampaignIdAndTypeIgnoreCaseAndVisibilityOrderByCreatedAtDesc(UUID campaignId, String type, JournalVisibility visibility);

    boolean existsByCampaign_IdAndUser_Id(UUID campaignId, UUID authorId);

}
