package org.sft.tabletoprpg.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sft.tabletoprpg.service.CharacterService;
import org.sft.tabletoprpg.service.dto.character.*;
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
@RequestMapping("/api/characters") // базовый префикс для legacy и ресурсных операций по персонажу
@RequiredArgsConstructor
public class CharacterController {

    private final CharacterService characterService;


    // ====== CREATE ======
    // LEGACY: POST /api/characters/crt/{campaignId}
    @PostMapping("/crt/{campaignId}")
    public ResponseEntity<CharacterDto> createCharacterLegacy(
        @PathVariable UUID campaignId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @Valid @RequestBody CharacterCreateRequest req,
        UriComponentsBuilder uriBuilder
    ){
        CharacterDto characterDto = characterService.createCharacter(campaignId, req, requesterId);
        URI location = uriBuilder.path("/api/characters/{id}")
            .buildAndExpand(characterDto.id()).toUri();
        return ResponseEntity.created(location).body(characterDto);
    }

    // CANONICAL: POST /api/campaigns/{campaignId}/characters
    @PostMapping("/api/campaigns/{campaignId}/characters")
    public ResponseEntity<CharacterDto> createCharacterCanonical(
        @PathVariable UUID campaignId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @Valid @RequestBody CharacterCreateRequest req,
        UriComponentsBuilder uriBuilder
    ){
        CharacterDto characterDto = characterService.createCharacter(campaignId, req, requesterId);
        URI location = uriBuilder.path("/api/characters/{id}")
            .buildAndExpand(characterDto.id()).toUri();
        return ResponseEntity.created(location).body(characterDto);
    }


    // ====== READ ======
    // GET /api/characters/{characterId}
    @GetMapping("/{characterId}")
    public ResponseEntity<CharacterDto> getById(@PathVariable UUID characterId){
        return ResponseEntity.ok(characterService.getById(characterId));
    }

    // LEGACY: GET /api/characters/by-campaign-id/{campaignId}
    @GetMapping("/by-campaign-id/{campaignId}")
    public ResponseEntity<List<CharacterDto>> listByCampaignLegacy(@PathVariable UUID campaignId){
        return ResponseEntity.ok(characterService.findCharactersByCampaign_Id(campaignId));
    }

    // CANONICAL: GET /api/campaigns/{campaignId}/characters
    @GetMapping("/api/campaigns/{campaignId}/characters")
    public ResponseEntity<List<CharacterDto>> listByCampaign(@PathVariable UUID campaignId){
        return ResponseEntity.ok(characterService.findCharactersByCampaign_Id(campaignId));
    }

    // LEGACY: GET /api/characters/by-owner-id/{ownerId}
    @GetMapping("/by-owner-id/{ownerId}")
    public ResponseEntity<List<CharacterDto>> listByOwner(@PathVariable UUID ownerId){
        return ResponseEntity.ok(characterService.findCharactersByOwner_Id(ownerId));
    }


    // ====== UPDATE (fields) ======
    // PATCH /api/characters/{characterId}
    @PatchMapping("/{characterId}")
    public ResponseEntity<CharacterDto> updateCharacter(
        @PathVariable UUID characterId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @Valid @RequestBody CharacterUpdateRequest req
    ){
        CharacterDto dto = characterService.updateCharacter(characterId, req, requesterId);
        return ResponseEntity.ok(dto);
    }

    // ====== UPDATE (HP) ======

    // LEGACY + CANONICAL алиасы:
    // - PATCH /api/characters/set-hp/{characterId}
    // - PATCH /api/characters/{characterId}/hp?hp=...
    @PatchMapping({"/set-hp/{characterId}", "/{characterId}/hp"})
    public ResponseEntity<CharacterDto> patchHp(
        @PathVariable UUID characterId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @RequestParam(value = "hp", required = false) Integer hpParam,
        @RequestBody(required = false) HpPatchRequest body
    ){
        CharacterDto dto = characterService.patchHp(characterId, hpParam, body, requesterId);
        return ResponseEntity.ok(dto);
    }


    // ====== DELETE ======
    // CANONICAL: DELETE /api/characters/{characterId}
    @DeleteMapping("/{characterId}")
    public ResponseEntity<Void> deleteCharacterCanonical(
        @PathVariable UUID characterId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId
    ){
        characterService.deleteCharacter(characterId, requesterId);
        return ResponseEntity.noContent().build();
    }

    // LEGACY: DELETE /api/characters/dlt/{characterId}
    @DeleteMapping("/dlt/{characterId}")
    public ResponseEntity<Void> deleteCharacterLegacy(
        @PathVariable UUID characterId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId
    ){
        characterService.deleteCharacter(characterId, requesterId);
        return ResponseEntity.noContent().build();
    }
}
