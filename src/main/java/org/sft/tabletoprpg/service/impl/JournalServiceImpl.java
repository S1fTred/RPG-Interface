package org.sft.tabletoprpg.service.impl;

import lombok.RequiredArgsConstructor;
import org.sft.tabletoprpg.domain.Campaign;
import org.sft.tabletoprpg.domain.JournalEntry;
import org.sft.tabletoprpg.domain.User;
import org.sft.tabletoprpg.repo.CampaignMemberRepository;
import org.sft.tabletoprpg.repo.CampaignRepository;
import org.sft.tabletoprpg.repo.JournalEntryRepository;
import org.sft.tabletoprpg.repo.UserRepository;
import org.sft.tabletoprpg.service.JournalService;
import org.sft.tabletoprpg.service.dto.journal.JournalEntryCreateRequest;
import org.sft.tabletoprpg.service.dto.journal.JournalEntryDto;
import org.sft.tabletoprpg.service.exception.ForbiddenException;
import org.sft.tabletoprpg.service.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class JournalServiceImpl implements JournalService {

    private final JournalEntryRepository journalEntryRepository;
    private final CampaignRepository campaignRepository;
    private final UserRepository userRepository;
    private final CampaignMemberRepository campaignMemberRepository;

    @Transactional
    @Override
    public JournalEntryDto createJournal(JournalEntryCreateRequest req) {

        Campaign campaign = campaignRepository.findById(req.campaignId())
                .orElseThrow(() -> new NotFoundException("Кампейн не найден"));

        User author = userRepository.findById(req.authorId())
                .orElseThrow(() -> new NotFoundException("Автор не найден"));

        if (!journalEntryRepository.existsByCampaign_IdAndUser_Id(req.campaignId(), req.authorId())){
            throw new ForbiddenException("Автор - не член кампейна");
        }

        JournalEntry journalEntry = toEntity(req);
        journalEntry.setCampaign(campaign);
        journalEntry.setAuthor(author);
        journalEntryRepository.save(journalEntry);

        return toDto(journalEntry);
    }

    @Transactional(readOnly = true)
    @Override
    public List<JournalEntryDto> findJournalsByCampaign_Id(UUID campaignId) {
        return journalEntryRepository.findByCampaign_IdOrderByCreatedAtDesc(campaignId).stream().map(this::toDto).toList();
    }



    //----------------------МАППЕРЫ-------------------------//

    private JournalEntry toEntity(JournalEntryCreateRequest req){
        return JournalEntry.builder()
                .title(req.title())
                .content(req.content())
                .build();
    }

    private JournalEntryDto toDto(JournalEntry journalEntry){
        return JournalEntryDto.builder()
                .id(journalEntry.getId())
                .campaignId(journalEntry.getCampaign().getId())
                .authorId(journalEntry.getAuthor().getId())
                .title(journalEntry.getTitle())
                .content(journalEntry.getContent())
                .createdAt(journalEntry.getCreatedAt())
                .build();
    }
}
