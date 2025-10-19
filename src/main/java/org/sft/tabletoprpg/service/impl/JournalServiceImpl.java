package org.sft.tabletoprpg.service.impl;

import lombok.RequiredArgsConstructor;
import org.sft.tabletoprpg.domain.Campaign;
import org.sft.tabletoprpg.domain.JournalEntry;
import org.sft.tabletoprpg.domain.JournalVisibility;
import org.sft.tabletoprpg.domain.User;
import org.sft.tabletoprpg.repo.CampaignMemberRepository;
import org.sft.tabletoprpg.repo.CampaignRepository;
import org.sft.tabletoprpg.repo.JournalEntryRepository;
import org.sft.tabletoprpg.repo.UserRepository;
import org.sft.tabletoprpg.service.JournalService;
import org.sft.tabletoprpg.service.dto.journal.JournalEntryCreateRequest;
import org.sft.tabletoprpg.service.dto.journal.JournalEntryDto;
import org.sft.tabletoprpg.service.dto.journal.JournalEntryUpdateRequest;
import org.sft.tabletoprpg.service.exception.BadRequestException;
import org.sft.tabletoprpg.service.exception.ForbiddenException;
import org.sft.tabletoprpg.service.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JournalServiceImpl implements JournalService {

    private final JournalEntryRepository journalEntryRepository;
    private final CampaignRepository campaignRepository;
    private final UserRepository userRepository;
    private final CampaignMemberRepository campaignMemberRepository;

    @Override
    public JournalEntryDto getJournalById(UUID entryId, UUID requesterId) {
        JournalEntry entry = journalEntryRepository.findById(entryId)
            .orElseThrow(() -> new NotFoundException("Запись не найдена"));

        UUID campaignId = entry.getCampaign().getId();
        boolean isGm = entry.getCampaign().getGm().getId().equals(requesterId);
        boolean isMember = isGm || campaignMemberRepository.existsByCampaign_IdAndUser_Id(campaignId, requesterId);
        if (!isMember) {
            throw new ForbiddenException("Доступ только для участников кампании");
        }

        if (!isGm && entry.getVisibility() != JournalVisibility.PLAYERS) {
            throw new ForbiddenException("Нет доступа к записи (GM_ONLY)");
        }
        return toDto(entry);
    }

    @Override
    public List<JournalEntryDto> findJournalsByCampaign_Id(UUID campaignId) {
        return journalEntryRepository.findByCampaign_IdOrderByCreatedAtDesc(campaignId)
            .stream().map(this::toDto).toList();
    }

    @Override
    public List<JournalEntryDto> listJournals(UUID campaignId, UUID requesterId, String type, Boolean onlyPlayersVisible) {

        Campaign campaign = campaignRepository.findById(campaignId)
            .orElseThrow(() -> new NotFoundException("Кампания не найдена"));

        boolean isGm = campaign.getGm().getId().equals(requesterId);
        boolean isMember = isGm || campaignMemberRepository.existsByCampaign_IdAndUser_Id(campaignId, requesterId);
        if (!isMember) {
            throw new ForbiddenException("Доступ только для участников кампании");
        }

        String typeNorm = (type == null) ? null : type.trim();
        boolean onlyPlayers = (onlyPlayersVisible != null && onlyPlayersVisible);

        List<JournalEntry> entries;
        if (typeNorm == null || typeNorm.isBlank()) {
            if (isGm && !onlyPlayers) {
                entries = journalEntryRepository.findByCampaign_IdOrderByCreatedAtDesc(campaignId);
            } else {
                entries = journalEntryRepository.findByCampaign_IdAndVisibilityOrderByCreatedAtDesc(
                    campaignId, JournalVisibility.PLAYERS);
            }
        } else {
            if (isGm && !onlyPlayers) {
                entries = journalEntryRepository.findByCampaign_IdAndTypeIgnoreCaseOrderByCreatedAtDesc(
                    campaignId, typeNorm);
            } else {
                entries = journalEntryRepository.findByCampaign_IdAndTypeIgnoreCaseAndVisibilityOrderByCreatedAtDesc(
                    campaignId, typeNorm, JournalVisibility.PLAYERS);
            }
        }

        return entries.stream().map(this::toDto).toList();
    }

    @Transactional
    @Override
    public JournalEntryDto createJournal(UUID campaignId, UUID requesterId, JournalEntryCreateRequest req) {
        Campaign campaign = campaignRepository.findById(campaignId)
            .orElseThrow(() -> new NotFoundException("Кампания не найдена"));

        // Только GM может создавать записи журнала
        if (!campaign.getGm().getId().equals(requesterId)) {
            throw new ForbiddenException("Только GM может создавать записи журнала");
        }

        User author = userRepository.findById(requesterId)
            .orElseThrow(() -> new NotFoundException("Автор не найден"));

        // Валидации обязательных полей
        String type = req.type();
        if (type == null || type.trim().isEmpty()) {
            throw new BadRequestException("Тип записи не должен быть пустым");
        }
        if (req.visibility() == null) {
            throw new BadRequestException("Видимость записи не должна быть пустой");
        }

        JournalEntry entry = toEntity(req);
        entry.setType(type.trim());
        entry.setCampaign(campaign);
        entry.setAuthor(author);

        journalEntryRepository.save(entry);
        return toDto(entry);
    }

    @Transactional
    @Override
    public JournalEntryDto updateJournal(UUID entryId, UUID requesterId, JournalEntryUpdateRequest req) {
        JournalEntry entry = journalEntryRepository.findById(entryId)
            .orElseThrow(() -> new NotFoundException("Запись не найдена"));

        UUID gmOfCampaign = entry.getCampaign().getGm().getId();
        if (!gmOfCampaign.equals(requesterId)) {
            throw new ForbiddenException("Только GM может редактировать записи журнала");
        }

        if (req.type() != null) {
            String type = req.type().trim();
            if (type.isEmpty()) throw new BadRequestException("Тип записи не должен быть пустым");
            entry.setType(type);
        }
        if (req.visibility() != null) {
            entry.setVisibility(req.visibility());
        }
        if (req.title() != null) {
            String t = req.title().trim();
            if (t.isEmpty()) throw new BadRequestException("Название не должно быть пустым");
            entry.setTitle(t);
        }
        if (req.content() != null) {
            String c = req.content().trim();
            if (c.isEmpty()) throw new BadRequestException("Контент не должен быть пустым");
            entry.setContent(c);
        }
        if (req.tags() != null) {
            String tg = req.tags().trim();
            entry.setTags(tg.isEmpty() ? null : tg);
        }

        journalEntryRepository.save(entry);
        return toDto(entry);
    }

    @Transactional
    @Override
    public void deleteJournal(UUID entryId, UUID requesterId) {
        JournalEntry entry = journalEntryRepository.findById(entryId)
            .orElseThrow(() -> new NotFoundException("Запись не найдена"));

        UUID gmOfCampaign = entry.getCampaign().getGm().getId();
        if (!gmOfCampaign.equals(requesterId)) {
            throw new ForbiddenException("Только GM может удалять записи журнала");
        }

        journalEntryRepository.delete(entry);
    }

    // ---------------------- МАППЕРЫ ---------------------- //

    private JournalEntry toEntity(JournalEntryCreateRequest req){
        JournalEntry e = new JournalEntry();
        e.setVisibility(req.visibility());
        e.setTitle(req.title() == null ? null : req.title().trim());
        String content = req.content() == null ? null : req.content().trim();
        if (content == null || content.isEmpty()) {
            throw new BadRequestException("Контент не должен быть пустым");
        }
        e.setContent(content);
        e.setTags(req.tags() == null ? null : req.tags().trim());
        return e;
    }

    private JournalEntryDto toDto(JournalEntry journalEntry){
        return JournalEntryDto.builder()
            .id(journalEntry.getId())
            .campaignId(journalEntry.getCampaign().getId())
            .authorId(journalEntry.getAuthor().getId())
            .type(journalEntry.getType())
            .visibility(journalEntry.getVisibility())
            .title(journalEntry.getTitle())
            .content(journalEntry.getContent())
            .tags(journalEntry.getTags())
            .createdAt(journalEntry.getCreatedAt())
            .build();
    }
}
