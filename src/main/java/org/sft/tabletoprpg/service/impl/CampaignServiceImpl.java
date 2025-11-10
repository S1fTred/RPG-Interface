package org.sft.tabletoprpg.service.impl;

import lombok.RequiredArgsConstructor;
import org.sft.tabletoprpg.domain.*;
import org.sft.tabletoprpg.domain.compositeKeys.CampaignMemberId;
import org.sft.tabletoprpg.repo.CampaignMemberRepository;
import org.sft.tabletoprpg.repo.CampaignRepository;
import org.sft.tabletoprpg.repo.CharacterRepository;
import org.sft.tabletoprpg.repo.UserRepository;
import org.sft.tabletoprpg.service.CampaignService;
import org.sft.tabletoprpg.service.dto.campaign.*;
import org.sft.tabletoprpg.service.exception.ConflictException;
import org.sft.tabletoprpg.service.exception.ForbiddenException;
import org.sft.tabletoprpg.service.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CampaignServiceImpl implements CampaignService {

    private final CampaignRepository campaignRepository;
    private final UserRepository userRepository;
    private final CampaignMemberRepository campaignMemberRepository;
    private final CharacterRepository characterRepository;

    /* ============================ CREATE / UPDATE / DELETE ============================ */

    @Transactional
    @Override
    public CampaignDto createCampaign(UUID gmId, CampaignCreateRequest req) {
        User gm = userRepository.findById(gmId)
            .orElseThrow(() -> new NotFoundException("Гейм-мастер не найден"));

        String name = req.name() == null ? null : req.name().trim();
        if (name == null || name.isEmpty()) {
            throw new ConflictException("Название кампании не должно быть пустым");
        }

        Campaign campaign = toEntity(req);
        campaign.setName(name);
        campaign.setGm(gm);
        campaignRepository.save(campaign);

        // гарантируем членство GM
        if (!campaignMemberRepository.existsByCampaign_IdAndUser_Id(campaign.getId(), gm.getId())) {
            CampaignMember cm = CampaignMember.builder()
                .id(new CampaignMemberId(campaign.getId(), gm.getId()))
                .campaign(campaign)
                .user(gm)
                .roleInCampaign(CampaignRole.GM)
                .build();
            campaignMemberRepository.save(cm);
        }
        return toDto(campaign);
    }

    @Transactional
    @Override
    public CampaignDto updateCampaign(UUID campaignId, UUID requesterId, CampaignUpdateRequest req) {
        Campaign campaign = campaignRepository.findById(campaignId)
            .orElseThrow(() -> new NotFoundException("Кампания не найдена"));

        if (!campaign.getGm().getId().equals(requesterId)) {
            throw new ForbiddenException("Только GM может редактировать кампанию");
        }

        if (req.name() != null) {
            String name = req.name().trim();
            if (name.isEmpty()) throw new ConflictException("Название кампании не должно быть пустым");
            campaign.setName(name);
        }
        if (req.description() != null) {
            campaign.setDescription(req.description().trim());
        }
        campaignRepository.save(campaign);
        return toDto(campaign);
    }

    @Transactional
    @Override
    public void deleteCampaign(UUID campaignId, UUID requesterId) {
        Campaign campaign = campaignRepository.findById(campaignId)
            .orElseThrow(() -> new NotFoundException("Кампания не найдена"));

        if (!campaign.getGm().getId().equals(requesterId)) {
            throw new ForbiddenException("Только GM может удалять кампанию");
        }
        if (characterRepository.existsByCampaign_Id(campaignId)) {
            throw new ConflictException("Нельзя удалить кампанию: в ней есть персонажи");
        }
        campaignRepository.delete(campaign);
    }

    /* ============================ MEMBERS (idempotent) ============================ */

    @Transactional
    @Override
    public CampaignRoleResult upsertMember(UUID campaignId, UUID userId, CampaignRole role, UUID requesterId) {
        Campaign campaign = campaignRepository.findById(campaignId)
            .orElseThrow(() -> new NotFoundException("Кампания не найдена"));

        if (!campaign.getGm().getId().equals(requesterId)) {
            throw new ForbiddenException("Только GM может добавлять/обновлять участников");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));

        CampaignMemberId id = new CampaignMemberId(campaignId, userId);
        CampaignMember existing = campaignMemberRepository.findById(id).orElse(null);

        CampaignRole targetRole = (role == null ? CampaignRole.PLAYER : role);

        // Запрет на «второго GM»
        if (targetRole == CampaignRole.GM && !userId.equals(campaign.getGm().getId())) {
            throw new ForbiddenException("Нельзя назначить второго GM. Передайте GM-ство отдельным сценарием.");
        }

        if (existing == null) {
            CampaignMember cm = CampaignMember.builder()
                .id(id)
                .campaign(campaign)
                .user(user)
                .roleInCampaign(targetRole)
                .build();
            campaignMemberRepository.save(cm);

            return new CampaignRoleResult(toMemberDto(cm), true); // created = true
        } else {
            // идемпотентный PUT: если роль та же — ничего не меняем
            if (existing.getRoleInCampaign() != targetRole) {
                existing.setRoleInCampaign(targetRole);
                campaignMemberRepository.save(existing);
            }
            return new CampaignRoleResult(toMemberDto(existing), false); // created = false
        }
    }

    @Transactional
    @Override
    public CampaignMemberDto updateMemberRole(UUID campaignId, UUID userId, CampaignRole role, UUID requesterId) {
        if (role == null) {
            throw new IllegalArgumentException("roleInCampaign не должен быть пустым");
        }
        Campaign campaign = campaignRepository.findById(campaignId)
            .orElseThrow(() -> new NotFoundException("Кампания не найдена"));

        if (!campaign.getGm().getId().equals(requesterId)) {
            throw new ForbiddenException("Только GM может менять роль участника");
        }

        CampaignMemberId id = new CampaignMemberId(campaignId, userId);
        CampaignMember member = campaignMemberRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Пользователь не является участником кампании"));

        if (role == CampaignRole.GM && !userId.equals(campaign.getGm().getId())) {
            throw new ForbiddenException("Нельзя назначить второго GM. Передайте GM-ство отдельным сценарием.");
        }

        member.setRoleInCampaign(role);
        campaignMemberRepository.save(member);
        return toMemberDto(member);
    }

    @Override
    public List<CampaignMemberDto> listMembers(UUID campaignId, UUID requesterId) {
        Campaign campaign = campaignRepository.findById(campaignId)
            .orElseThrow(() -> new NotFoundException("Кампания не найдена"));

        if (!campaign.getGm().getId().equals(requesterId)) {
            throw new ForbiddenException("Только GM может просматривать список участников");
        }

        return campaignMemberRepository.findByCampaign_Id(campaignId).stream()
            .map(this::toMemberDto)
            .toList();
    }

    @Transactional
    @Override
    public void removeMember(UUID campaignId, UUID userId, UUID requesterId) {
        Campaign campaign = campaignRepository.findById(campaignId)
            .orElseThrow(() -> new NotFoundException("Кампания не найдена"));

        if (!campaign.getGm().getId().equals(requesterId)) {
            throw new ForbiddenException("Только GM может удалять участников");
        }
        if (userId.equals(campaign.getGm().getId())) {
            throw new ForbiddenException("Нельзя удалить GM из собственной кампании");
        }

        CampaignMemberId id = new CampaignMemberId(campaignId, userId);
        CampaignMember member = campaignMemberRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Пользователь не является участником кампании"));

        // Дополнительно: удаляем всех персонажей userId в этой кампании
        List<org.sft.tabletoprpg.domain.Character> chars = characterRepository.findByOwner_Id(userId)
            .stream()
            .filter(ch -> ch.getCampaign().getId().equals(campaignId))
            .toList();
        for (org.sft.tabletoprpg.domain.Character ch : chars) {
            characterRepository.delete(ch);
        }

        campaignMemberRepository.delete(member);
    }

    /* ============================ READS ============================ */

    @Override
    public List<CampaignDto> findMyCampaigns(UUID gmId) {
        return findCampaignsByGm_Id(gmId);
    }

    @Override
    public List<CampaignDto> findCampaignsByGm_Id(UUID gmId) {
        // если у репозитория есть метод с сортировкой — используем его, иначе отсортируем вручную
        List<Campaign> list = campaignRepository.findByGm_Id(gmId);
        return list.stream()
            .sorted(Comparator.comparing(Campaign::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .map(this::toDto)
            .toList();
    }

    /** НОВОЕ: кампании, где пользователь УЧАСТНИК (PLAYER или GM). */
    @Override
    public List<CampaignDto> findCampaignsByMember(UUID userId) {
        if (userId == null) return List.of();

        // Требуется метод в репозитории членства: List<CampaignMember> findByUser_Id(UUID userId);
        List<CampaignMember> memberships = campaignMemberRepository.findByUser_Id(userId);

        // Соберём уникальные кампании по id, сохраним порядок добавления,
        // затем отсортируем по createdAt (desc) перед маппингом в DTO.
        Map<UUID, Campaign> byId = memberships.stream()
            .map(CampaignMember::getCampaign)
            .filter(Objects::nonNull)
            .collect(Collectors.toMap(
                Campaign::getId,
                Function.identity(),
                (a, b) -> a,
                LinkedHashMap::new
            ));

        return byId.values().stream()
            .sorted(Comparator.comparing(Campaign::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .map(this::toDto)
            .toList();
    }

    @Override
    public CampaignDto findCampaignById(UUID id) {
        Campaign campaign = campaignRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Кампания не найдена"));
        return toDto(campaign);
    }

    /* ============================ МАППЕРЫ ============================ */

    private Campaign toEntity(CampaignCreateRequest req) {
        return Campaign.builder()
            .name(req.name())
            .description(req.description() == null ? null : req.description().trim())
            .build();
    }

    private CampaignDto toDto(Campaign campaign) {
        return CampaignDto.builder()
            .id(campaign.getId())
            .name(campaign.getName())
            .description(campaign.getDescription())
            .gmId(campaign.getGm().getId())
            .createdAt(campaign.getCreatedAt())
            .updatedAt(campaign.getUpdatedAt())
            .build();
    }

    private CampaignMemberDto toMemberDto(CampaignMember cm) {
        return new CampaignMemberDto(
            cm.getUser().getId(),
            cm.getUser().getUsername(),
            cm.getUser().getEmail(),
            cm.getRoleInCampaign().name()
        );
    }
}
