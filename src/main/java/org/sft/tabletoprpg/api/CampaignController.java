package org.sft.tabletoprpg.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sft.tabletoprpg.security.UserPrincipal;
import org.sft.tabletoprpg.service.CampaignService;
import org.sft.tabletoprpg.service.dto.campaign.*;
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
    @PostMapping("/crt")
    public ResponseEntity<CampaignDto> createCampaignLegacy(
        @AuthenticationPrincipal UserPrincipal me,
        @Valid @RequestBody CampaignCreateRequest req
    ) {
        CampaignDto dto = campaignService.createCampaign(me.getId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

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
    @GetMapping("/campaign-by-id/{id}")
    public ResponseEntity<CampaignDto> getCampaignByIdLegacy(@PathVariable UUID id) {
        return ResponseEntity.ok(campaignService.findCampaignById(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CampaignDto> getCampaignById(@PathVariable UUID id) {
        return ResponseEntity.ok(campaignService.findCampaignById(id));
    }

    @GetMapping("/list-by-me")
    public ResponseEntity<List<CampaignDto>> listMineLegacy(@AuthenticationPrincipal UserPrincipal me) {
        return ResponseEntity.ok(campaignService.findMyCampaigns(me.getId()));
    }

    @GetMapping
    public ResponseEntity<List<CampaignDto>> listMine(@AuthenticationPrincipal UserPrincipal me) {
        return ResponseEntity.ok(campaignService.findMyCampaigns(me.getId()));
    }

    @GetMapping("/list-by-gm")
    public ResponseEntity<List<CampaignDto>> listByGmLegacy(@RequestParam("gmId") UUID gmId) {
        return ResponseEntity.ok(campaignService.findCampaignsByGm_Id(gmId));
    }

    @GetMapping("/by-gm/{gmId}")
    public ResponseEntity<List<CampaignDto>> listByGm(@PathVariable UUID gmId) {
        return ResponseEntity.ok(campaignService.findCampaignsByGm_Id(gmId));
    }

    // ---------- UPDATE ----------
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
    @DeleteMapping("/dlt/{id}")
    public ResponseEntity<Void> deleteCampaignLegacy(
        @AuthenticationPrincipal UserPrincipal me,
        @PathVariable UUID id
    ) {
        campaignService.deleteCampaign(id, me.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCampaign(
        @AuthenticationPrincipal UserPrincipal me,
        @PathVariable UUID id
    ) {
        campaignService.deleteCampaign(id, me.getId());
        return ResponseEntity.noContent().build();
    }

    // ---------- MEMBERS (idempotent) ----------

    // PUT: создать или обновить участника кампании
    // Body: { "roleInCampaign": "PLAYER" } (опционально; по умолчанию PLAYER)
    @PutMapping("/{campaignId}/members/{userId}")
    public ResponseEntity<CampaignMemberDto> upsertMember(
        @PathVariable UUID campaignId,
        @PathVariable UUID userId,
        @AuthenticationPrincipal UserPrincipal me,
        @RequestBody(required = false) AddMemberRequest req,
        UriComponentsBuilder uriBuilder
    ) {
        CampaignRoleResult result = campaignService.upsertMember(
            campaignId,
            userId,
            (req == null ? null : req.roleInCampaign()),
            me.getId()
        );

        if (result.created()) {
            URI location = uriBuilder
                .path("/api/campaigns/{campaignId}/members/{userId}")
                .buildAndExpand(campaignId, userId).toUri();
            return ResponseEntity.created(location).body(result.dto());
        }
        return ResponseEntity.ok(result.dto());
    }

    // PATCH: изменить только роль участника
    @PatchMapping("/{campaignId}/members/{userId}")
    public ResponseEntity<CampaignMemberDto> updateMemberRole(
        @PathVariable UUID campaignId,
        @PathVariable UUID userId,
        @AuthenticationPrincipal UserPrincipal me,
        @RequestBody AddMemberRequest req
    ) {
        CampaignMemberDto dto = campaignService.updateMemberRole(
            campaignId, userId,
            req.roleInCampaign(),
            me.getId()
        );
        return ResponseEntity.ok(dto);
    }

    // GET: список участников
    @GetMapping("/{campaignId}/members")
    public ResponseEntity<List<CampaignMemberDto>> listMembers(
        @PathVariable UUID campaignId,
        @AuthenticationPrincipal UserPrincipal me
    ) {
        return ResponseEntity.ok(campaignService.listMembers(campaignId, me.getId()));
    }

    // DELETE: удалить участника
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
