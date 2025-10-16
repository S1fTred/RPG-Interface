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

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CampaignServiceImpl implements CampaignService {

    private final CampaignRepository campaignRepository;
    private final UserRepository userRepository;
    private final CampaignMemberRepository campaignMemberRepository;
    private final CharacterRepository characterRepository;

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

        // Добавим GM как участника (если ещё нет)
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

    @Transactional
    @Override
    public void addMember(UUID campaignId, UUID requesterId, AddMemberRequest req) {
        Campaign campaign = campaignRepository.findById(campaignId)
            .orElseThrow(() -> new NotFoundException("Кампания не найдена"));

        if (!campaign.getGm().getId().equals(requesterId)) {
            throw new ForbiddenException("Только GM может добавлять участников");
        }

        User user = userRepository.findById(req.userId())
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));

        // 🚫 был баг: проверяли campaignRepository.existsByIdAndGm_Id(...)
        // ✅ правильная проверка членства:
        if (campaignMemberRepository.existsByCampaign_IdAndUser_Id(campaignId, user.getId())) {
            throw new ConflictException("Пользователь уже есть в кампании");
        }

        // Нельзя назначить второго GM
        if (req.roleInCampaign() == CampaignRole.GM && !user.getId().equals(campaign.getGm().getId())) {
            throw new ForbiddenException("Нельзя назначить второго GM. Передайте GM-ство явно.");
        }

        CampaignMember campaignMember = CampaignMember.builder()
            .id(new CampaignMemberId(campaignId, user.getId()))
            .campaign(campaign)
            .user(user)
            .roleInCampaign(req.roleInCampaign())
            .build();

        campaignMemberRepository.save(campaignMember);
    }

    @Override
    public List<CampaignDto> findMyCampaigns(UUID gmId) {
        return findCampaignsByGm_Id(gmId);
    }

    @Override
    public List<CampaignDto> findCampaignsByGm_Id(UUID gmId) {
        return campaignRepository.findByGm_Id(gmId).stream()
            .map(this::toDto)
            .toList();
    }

    @Override
    public CampaignDto findCampaignById(UUID id) {
        Campaign campaign = campaignRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Кампания не найдена"));
        return toDto(campaign);
    }

    @Override
    public List<CampaignMemberDto> listMembers(UUID campaignId, UUID requesterId) {
        Campaign campaign = campaignRepository.findById(campaignId)
            .orElseThrow(() -> new NotFoundException("Кампания не найдена"));

        // Доступ: GM кампании (при желании можно разрешить и участникам)
        if (!campaign.getGm().getId().equals(requesterId)) {
            throw new ForbiddenException("Только GM может просматривать список участников");
        }

        return campaignMemberRepository.findByCampaign_Id(campaignId).stream()
            .map(cm -> new CampaignMemberDto(
                cm.getUser().getId(),
                cm.getUser().getUsername(),
                cm.getUser().getEmail(),
                cm.getRoleInCampaign().name()
            ))
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
        // Нельзя удалить самого GM
        if (userId.equals(campaign.getGm().getId())) {
            throw new ForbiddenException("Нельзя удалить GM из собственной кампании");
        }

        CampaignMemberId id = new CampaignMemberId(campaignId, userId);
        boolean exists = campaignMemberRepository.existsById(id);
        if (!exists) {
            throw new NotFoundException("Пользователь не является участником кампании");
        }
        campaignMemberRepository.deleteById(id);
    }

    // --------------------------- МАППЕРЫ ------------------------------------- //
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
}
