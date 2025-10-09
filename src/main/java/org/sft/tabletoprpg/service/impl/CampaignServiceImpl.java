package org.sft.tabletoprpg.service.impl;

import lombok.RequiredArgsConstructor;
import org.sft.tabletoprpg.domain.Campaign;
import org.sft.tabletoprpg.domain.CampaignMember;
import org.sft.tabletoprpg.domain.CampaignRole;
import org.sft.tabletoprpg.domain.User;
import org.sft.tabletoprpg.domain.compositeKeys.CampaignMemberId;
import org.sft.tabletoprpg.repo.CampaignMemberRepository;
import org.sft.tabletoprpg.repo.CampaignRepository;
import org.sft.tabletoprpg.repo.CharacterRepository;
import org.sft.tabletoprpg.repo.UserRepository;
import org.sft.tabletoprpg.service.CampaignService;
import org.sft.tabletoprpg.service.dto.campaign.AddMemberRequest;
import org.sft.tabletoprpg.service.dto.campaign.CampaignCreateRequest;
import org.sft.tabletoprpg.service.dto.campaign.CampaignDto;
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
            .orElseThrow(()->new NotFoundException("Гейм-мастер не найден"));

        String name = req.name() == null ? null : req.name().trim();
        if (name==null || name.isEmpty()){
            throw new ConflictException("Название кампании не должно быть пустым");
        }

        Campaign campaign = toEntity(req);
        campaign.setName(name);
        campaign.setGm(gm);

        campaignRepository.save(campaign);

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
    public void deleteCampaign(UUID gmId, UUID campaignId) {

        Campaign campaign = campaignRepository.findById(campaignId)
            .orElseThrow(()-> new NotFoundException("Кампания не найдена"));

        if (!campaign.getGm().getId().equals(gmId)) {
            throw new ForbiddenException("Только GM может удалять кампанию");
        }

        if (characterRepository.existsByCampaign_Id(campaignId)) {
            throw new ConflictException("Нельзя удалить кампанию: в ней есть персонажи");
        }

        campaignRepository.delete(campaign);
    }


    @Transactional
    @Override
    public void addMember(UUID campaignId, UUID gmId, AddMemberRequest req) {
        Campaign campaign = campaignRepository.findById(campaignId)
            .orElseThrow(() -> new NotFoundException("Кампания не найдена"));

        User user = userRepository.findById(req.userId())
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));

        if (!campaign.getGm().getId().equals(gmId)) {
            throw new ForbiddenException("Только GM может добавлять участников");
        }

        if (campaignRepository.existsByIdAndGm_Id(campaignId, req.userId())) {
            throw new ConflictException("Пользователь уже есть в компании");
        }

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
    public List<CampaignDto> findCampaignsByGm_Id(UUID gmId) {
        return campaignRepository.findByGm_Id(gmId)
            .stream()
            .map(this::toDto)
            .toList();
    }


    @Override
    public CampaignDto findCampaignById(UUID id) {
        Campaign campaign = campaignRepository.findById(id)
            .orElseThrow(()-> new NotFoundException("Кампания не найдена"));
        return toDto(campaign);
    }


    //---------------------------МАППЕРЫ-------------------------------------//

    private Campaign toEntity(CampaignCreateRequest req){
        return Campaign.builder()
            .name(req.name())
            .description(req.description() == null ? null : req.description().trim())
            .build();
    }

    private CampaignDto toDto(Campaign campaign){
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
