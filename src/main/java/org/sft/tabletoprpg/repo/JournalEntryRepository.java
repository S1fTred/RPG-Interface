package org.sft.tabletoprpg.repo;

import org.sft.tabletoprpg.domain.JournalEntry;
import org.sft.tabletoprpg.domain.JournalVisibility;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JournalEntryRepository extends JpaRepository<JournalEntry, UUID> {

    List<JournalEntry> findByCampaign_IdOrderByCreatedAtDesc(UUID campaignId);
    List<JournalEntry> findByCampaign_IdAndVisibilityOrderByCreatedAtDesc(UUID campaignId, JournalVisibility visibility);
    List<JournalEntry> findByCampaign_IdAndTypeIgnoreCaseOrderByCreatedAtDesc(UUID campaignId, String type);
    List<JournalEntry> findByCampaign_IdAndTypeIgnoreCaseAndVisibilityOrderByCreatedAtDesc(UUID campaignId, String type, JournalVisibility visibility);
    boolean existsByAuthor_Id(UUID authorId);

    // Personal journals (campaign is null)
    List<JournalEntry> findByAuthor_IdAndCampaignIsNullOrderByCreatedAtDesc(UUID authorId);

}
