package org.sft.tabletoprpg.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sft.tabletoprpg.service.CharacterService;
import org.sft.tabletoprpg.service.dto.character.*;
import org.sft.tabletoprpg.service.exception.BadRequestException;
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
@RequestMapping("/api/characters")
@RequiredArgsConstructor
public class CharacterController {

    private final CharacterService characterService;

    // ---- LEGACY создание (сохраняем для обратной совместимости)
    @PostMapping("/crt/{campaignId}")
    public ResponseEntity<CharacterDto> createCharacterLegacy(
        @PathVariable UUID campaignId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @Valid @RequestBody CharacterCreateRequest req,
        UriComponentsBuilder uriBuilder
    ){
        if (!campaignId.equals(req.campaignId())){
            throw new BadRequestException("Кампании не соответствуют");
        }
        CharacterDto characterDto = characterService.createCharacter(req, requesterId);
        URI location = uriBuilder.path("/api/characters/{id}")
            .buildAndExpand(characterDto.id()).toUri();
        return ResponseEntity.created(location).body(characterDto);
    }

    // ---- Канонический REST: POST /api/campaigns/{campaignId}/characters
    @PostMapping(path = "/../campaigns/{campaignId}/characters")
    public ResponseEntity<CharacterDto> createCharacterCanonical(
        @PathVariable UUID campaignId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @Valid @RequestBody CharacterCreateRequest req,
        UriComponentsBuilder uriBuilder
    ){
        if (!campaignId.equals(req.campaignId())){
            throw new BadRequestException("Кампании не соответствуют");
        }
        CharacterDto characterDto = characterService.createCharacter(req, requesterId);
        URI location = uriBuilder.path("/api/characters/{id}")
            .buildAndExpand(characterDto.id()).toUri();
        return ResponseEntity.created(location).body(characterDto);
    }

    // ---- Получить по ID
    @GetMapping("/{characterId}")
    public ResponseEntity<CharacterDto> getById(@PathVariable UUID characterId){
        return ResponseEntity.ok(characterService.getById(characterId));
    }

    // ---- Список по кампании (старый URL оставляем)
    @GetMapping("/by-campaign-id/{campaignId}")
    public ResponseEntity<List<CharacterDto>> listByCampaignLegacy(@PathVariable UUID campaignId){
        return ResponseEntity.ok(characterService.findCharactersByCampaign_Id(campaignId));
    }

    // ---- Канонический REST alias: GET /api/campaigns/{campaignId}/characters
    @GetMapping(path = "/../campaigns/{campaignId}/characters")
    public ResponseEntity<List<CharacterDto>> listByCampaign(@PathVariable UUID campaignId){
        return ResponseEntity.ok(characterService.findCharactersByCampaign_Id(campaignId));
    }

    // ---- Список по владельцу (как было)
    @GetMapping("/by-owner-id/{ownerId}")
    public ResponseEntity<List<CharacterDto>> listByOwner(@PathVariable UUID ownerId){
        return ResponseEntity.ok(characterService.findCharactersByOwner_Id(ownerId));
    }

    // ---- Обновление полей персонажа (имя/класс/раса/уровень/attributes/maxHp)
    @PatchMapping("/{characterId}")
    public ResponseEntity<CharacterDto> updateCharacter(
        @PathVariable UUID characterId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @Valid @RequestBody CharacterUpdateRequest req
    ){
        CharacterDto dto = characterService.updateCharacter(characterId, req, requesterId);
        return ResponseEntity.ok(dto);
    }

    // ---- HP: JSON {set|delta} ИЛИ query ?hp=
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

    // ---- Удаление
    @DeleteMapping("/dlt/{characterId}")
    public ResponseEntity<Void> deleteCharacter(
        @PathVariable UUID characterId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId
    ){
        characterService.deleteCharacter(characterId, requesterId);
        return ResponseEntity.noContent().build();
    }
}
