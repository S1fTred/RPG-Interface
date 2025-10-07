package org.sft.tabletoprpg.service;

import org.sft.tabletoprpg.service.dto.journal.JournalEntryCreateRequest;
import org.sft.tabletoprpg.service.dto.journal.JournalEntryDto;

import java.util.List;
import java.util.UUID;

public interface JournalService {

    JournalEntryDto createJournal(JournalEntryCreateRequest req);

    List<JournalEntryDto> findJournalsByCampaign_Id(UUID campaignId);
}
