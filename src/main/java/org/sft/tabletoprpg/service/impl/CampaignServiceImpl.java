package org.sft.tabletoprpg.service.impl;

import lombok.RequiredArgsConstructor;
import org.sft.tabletoprpg.domain.Campaign;
import org.sft.tabletoprpg.domain.CampaignMember;
import org.sft.tabletoprpg.domain.CampaignRole;
import org.sft.tabletoprpg.domain.User;
import org.sft.tabletoprpg.repo.CampaignMemberRepository;
import org.sft.tabletoprpg.repo.CampaignRepository;
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
public class CampaignServiceImpl implements CampaignService {

    private final CampaignRepository campaignRepository;
    private final UserRepository userRepository;
    private final CampaignMemberRepository  campaignMemberRepository;


    @Transactional
    @Override
    public CampaignDto createCampaign(UUID gmId, CampaignCreateRequest req) {
        User gm = userRepository.findById(gmId)
            .orElseThrow(()->new NotFoundException("Гейм-мастер не найден"));
        Campaign campaign = toEntity(req);

        campaign.setGm(gm);
        campaignRepository.save(campaign);

        return toDto(campaign);
    }


    @Transactional
    @Override
    public void addMember(UUID campaignId, AddMemberRequest req) {
        Campaign campaign = campaignRepository.findById(campaignId)
            .orElseThrow(() -> new NotFoundException("Кампания не найдена"));
        User user = userRepository.findById(req.userId())
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));

        if (campaignRepository.existsByIdAndGm_Id(campaignId, req.userId())) {
            throw new ConflictException("Пользователь уже есть в компании");
        }

        if (req.roleInCampaign() == CampaignRole.GM && !user.equals(campaign.getGm()) ){
            throw new ForbiddenException("Только Гейм-мастер этой кампании должен иметь роль 'Гейм-мастер'");
        }

        CampaignMember campaignMember = new CampaignMember().builder()
            .campaign(campaign)
            .user(user)
            .roleInCampaign(req.roleInCampaign())
            .build();

        campaignMemberRepository.save(campaignMember);
    }


    @Transactional(readOnly = true)
    @Override
    public List<CampaignDto> findCampaignsByGm_Id(UUID gmId) {
        return campaignRepository.findByGm_Id(gmId).stream().map(this::toDto).toList();
    }


    @Transactional(readOnly = true)
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
            .description(req.description())
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
