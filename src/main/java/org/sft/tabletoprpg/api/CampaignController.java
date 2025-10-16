package org.sft.tabletoprpg.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sft.tabletoprpg.security.UserPrincipal;
import org.sft.tabletoprpg.service.CampaignService;
import org.sft.tabletoprpg.service.dto.campaign.*;
import org.sft.tabletoprpg.service.exception.BadRequestException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@Slf4j
@Validated
@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignService campaignService;

    // ---------- CREATE ----------
    // Legacy: POST /api/campaigns/crt
    @PostMapping("/crt")
    public ResponseEntity<CampaignDto> createCampaignLegacy(
        @AuthenticationPrincipal UserPrincipal me,
        @Valid @RequestBody CampaignCreateRequest req
    ) {
        CampaignDto dto = campaignService.createCampaign(me.getId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    // Canonical: POST /api/campaigns
    @PostMapping
    public ResponseEntity<CampaignDto> createCampaign(
        @AuthenticationPrincipal UserPrincipal me,
        @Valid @RequestBody CampaignCreateRequest req,
        UriComponentsBuilder uriBuilder
    ) {
        CampaignDto dto = campaignService.createCampaign(me.getId(), req);
        URI location = uriBuilder.path("/api/campaigns/{id}")
            .buildAndExpand(dto.id()).toUri();
        return ResponseEntity.created(location).body(dto);
    }

    // ---------- READ ----------
    // Legacy: GET /api/campaigns/campaign-by-id/{id}
    @GetMapping("/campaign-by-id/{id}")
    public ResponseEntity<CampaignDto> getCampaignByIdLegacy(@PathVariable UUID id) {
        return ResponseEntity.ok(campaignService.findCampaignById(id));
    }

    // Canonical: GET /api/campaigns/{id}
    @GetMapping("/{id}")
    public ResponseEntity<CampaignDto> getCampaignById(@PathVariable UUID id) {
        return ResponseEntity.ok(campaignService.findCampaignById(id));
    }

    // Мои кампании как GM
    // Legacy: GET /api/campaigns/list-by-me
    @GetMapping("/list-by-me")
    public ResponseEntity<List<CampaignDto>> listMineLegacy(@AuthenticationPrincipal UserPrincipal me) {
        return ResponseEntity.ok(campaignService.findMyCampaigns(me.getId()));
    }

    // Canonical: GET /api/campaigns  (возвращает кампании текущего пользователя как GM)
    @GetMapping
    public ResponseEntity<List<CampaignDto>> listMine(@AuthenticationPrincipal UserPrincipal me) {
        return ResponseEntity.ok(campaignService.findMyCampaigns(me.getId()));
    }

    // Кампании указанного GM
    // Legacy: GET /api/campaigns/list-by-gm?gmId=...
    @GetMapping("/list-by-gm")
    public ResponseEntity<List<CampaignDto>> listByGmLegacy(@RequestParam("gmId") UUID gmId) {
        return ResponseEntity.ok(campaignService.findCampaignsByGm_Id(gmId));
    }

    // Canonical: GET /api/campaigns/by-gm/{gmId}
    @GetMapping("/by-gm/{gmId}")
    public ResponseEntity<List<CampaignDto>> listByGm(@PathVariable UUID gmId) {
        return ResponseEntity.ok(campaignService.findCampaignsByGm_Id(gmId));
    }

    // ---------- UPDATE ----------
    // Canonical: PATCH /api/campaigns/{id}
    @PatchMapping("/{id}")
    public ResponseEntity<CampaignDto> updateCampaign(
        @PathVariable UUID id,
        @AuthenticationPrincipal UserPrincipal me,
        @Valid @RequestBody CampaignUpdateRequest req
    ) {
        CampaignDto dto = campaignService.updateCampaign(id, me.getId(), req);
        return ResponseEntity.ok(dto);
    }

    // ---------- DELETE ----------
    // Legacy: DELETE /api/campaigns/dlt/{id}
    @DeleteMapping("/dlt/{id}")
    public ResponseEntity<Void> deleteCampaignLegacy(
        @AuthenticationPrincipal UserPrincipal me,
        @PathVariable UUID id
    ) {
        campaignService.deleteCampaign(id, me.getId());
        return ResponseEntity.noContent().build();
    }

    // Canonical: DELETE /api/campaigns/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCampaign(
        @AuthenticationPrincipal UserPrincipal me,
        @PathVariable UUID id
    ) {
        campaignService.deleteCampaign(id, me.getId());
        return ResponseEntity.noContent().build();
    }

    // ---------- MEMBERS ----------
    // Добавить участника
    @PostMapping("/{campaignId}/members")
    public ResponseEntity<Void> addMemberToCampaign(
        @PathVariable UUID campaignId,
        @AuthenticationPrincipal UserPrincipal me,
        @Valid @RequestBody AddMemberRequest req
    ) {
        if (req.campaignId() != null && !req.campaignId().equals(campaignId)) {
            throw new BadRequestException("campaignId в path и body должны совпадать");
        }
        campaignService.addMember(campaignId, me.getId(), req);
        return ResponseEntity.noContent().build();
    }

    // Список участников
    @GetMapping("/{campaignId}/members")
    public ResponseEntity<List<CampaignMemberDto>> listMembers(
        @PathVariable UUID campaignId,
        @AuthenticationPrincipal UserPrincipal me
    ) {
        return ResponseEntity.ok(campaignService.listMembers(campaignId, me.getId()));
    }

    // Удалить участника
    @DeleteMapping("/{campaignId}/members/{userId}")
    public ResponseEntity<Void> removeMember(
        @PathVariable UUID campaignId,
        @PathVariable UUID userId,
        @AuthenticationPrincipal UserPrincipal me
    ) {
        campaignService.removeMember(campaignId, userId, me.getId());
        return ResponseEntity.noContent().build();
    }
}
