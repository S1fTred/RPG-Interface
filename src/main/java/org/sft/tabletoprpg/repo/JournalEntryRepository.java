package org.sft.tabletoprpg.repo;

import org.sft.tabletoprpg.domain.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JournalEntryRepository extends JpaRepository<JournalEntry, UUID> {

    List<JournalEntry> findByCampaign_IdOrderByCreatedAtDesc(UUID campaignId);

    boolean existsByCampaign_IdAndUser_Id(UUID campaignId, UUID authorId);
}
