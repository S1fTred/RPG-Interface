package org.sft.tabletoprpg.service;

import org.sft.tabletoprpg.service.dto.journal.JournalEntryCreateRequest;
import org.sft.tabletoprpg.service.dto.journal.JournalEntryDto;
import org.sft.tabletoprpg.service.dto.journal.JournalEntryUpdateRequest;

import java.util.List;
import java.util.UUID;

public interface JournalService {

    JournalEntryDto getJournalById(UUID entryId, UUID requesterId);

    List<JournalEntryDto> findJournalsByCampaign_Id(UUID campaignId);

    // РЕКОМЕНДУЕМЫЕ сигнатуры (контроллер: /campaigns/{campaignId}/journal)
    List<JournalEntryDto> listJournals(UUID campaignId, UUID requesterId, String type, Boolean onlyPlayersVisible);

    JournalEntryDto createJournal(UUID campaignId, UUID gmId, JournalEntryCreateRequest req);

    JournalEntryDto updateJournal(UUID entryId, UUID gmId, JournalEntryUpdateRequest req);

    void deleteJournal(UUID entryId, UUID gmId);

    // Personal journals
    List<JournalEntryDto> listPersonal(UUID authorId);
    JournalEntryDto createPersonal(UUID authorId, JournalEntryCreateRequest req);
}
