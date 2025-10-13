package org.sft.tabletoprpg.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sft.tabletoprpg.security.UserPrincipal;
import org.sft.tabletoprpg.service.CampaignService;
import org.sft.tabletoprpg.service.dto.campaign.AddMemberRequest;
import org.sft.tabletoprpg.service.dto.campaign.CampaignCreateRequest;
import org.sft.tabletoprpg.service.dto.campaign.CampaignDto;
import org.sft.tabletoprpg.service.exception.BadRequestException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.UUID;

@Slf4j
@Validated
@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignService campaignService;

    @PostMapping("/crt")
    public ResponseEntity<CampaignDto> createCampaign(@AuthenticationPrincipal UserPrincipal me, @Valid @RequestBody CampaignCreateRequest req) {
        UUID gmId = me.getId();
        CampaignDto campaignDto = campaignService.createCampaign(gmId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(campaignDto);
    }

    @DeleteMapping("/dlt/{id}")
    public ResponseEntity<Void> deleteCampaign(@AuthenticationPrincipal UserPrincipal me, @PathVariable UUID id) {
        campaignService.deleteCampaign(id, me.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/campaign-by-id/{id}")
    public ResponseEntity<CampaignDto> getCampaignById(@PathVariable UUID id) {
        CampaignDto campaignDto = campaignService.findCampaignById(id);
        return ResponseEntity.ok(campaignDto);
    }

    // Список кампаний указанного GM (через query-параметр)
    @GetMapping("/list-by-gm")
    public ResponseEntity<List<CampaignDto>> listByGm(@RequestParam(name = "gmId") UUID gmId) {
        return ResponseEntity.ok(campaignService.findCampaignsByGm_Id(gmId));
    }

    // Список кампаний текущего пользователя как GM.
    @GetMapping("/list-by-me")
    public ResponseEntity<List<CampaignDto>> listMine(@AuthenticationPrincipal UserPrincipal me) {
        return ResponseEntity.ok(campaignService.findCampaignsByGm_Id(me.getId()));
    }

    @PostMapping("/{campaignId}/members")
    public ResponseEntity<Void> addMemberToCampaign(
        @PathVariable("campaignId") UUID campaignId,
        @AuthenticationPrincipal UserPrincipal me,
        @Valid @RequestBody AddMemberRequest req)
    {

        if (req.campaignId() != null && !req.campaignId().equals(campaignId)) throw new BadRequestException("campaignId в path и body должны совпадать");
        campaignService.addMember(campaignId, me.getId(), req);
        return ResponseEntity.noContent().build();
    }


}
