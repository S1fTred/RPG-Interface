package org.sft.tabletoprpg.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sft.tabletoprpg.service.CharacterService;
import org.sft.tabletoprpg.service.dto.character.CharacterCreateRequest;
import org.sft.tabletoprpg.service.dto.character.CharacterDto;
import org.sft.tabletoprpg.service.dto.character.HpPatchRequest;
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
@RequestMapping("/api/characters")
@RequiredArgsConstructor
public class CharacterController {

    private final CharacterService characterService;

    @PostMapping("/crt/{campaignId}")
    public ResponseEntity<CharacterDto> createCharacter(
        @PathVariable UUID campaignId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @Valid @RequestBody CharacterCreateRequest req,
        UriComponentsBuilder uriBuilder
    ){
        if (!campaignId.equals(req.campaignId())){
            throw new BadRequestException("Кампании не соответствуют");
        }

        CharacterDto characterDto = characterService.createCharacter(req, requesterId);

        URI location = uriBuilder
            .path("/api/characters/{id}")
            .buildAndExpand(characterDto.id())
            .toUri();

        return ResponseEntity.created(location).body(characterDto);
    }

    @DeleteMapping("/dlt/{characterId}")
    public ResponseEntity<Void> deleteCharacter(
        @PathVariable UUID characterId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId
    ){
        characterService.deleteCharacter(characterId, requesterId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/by-campaign-id/{campaignId}")
    public ResponseEntity<List<CharacterDto>> listByCampaign(@PathVariable UUID campaignId){
        List<CharacterDto> list = characterService.findCharactersByCampaign_Id(campaignId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/by-owner-id/{ownerId}")
    public ResponseEntity<List<CharacterDto>> listByOwner(@PathVariable UUID ownerId){
        List<CharacterDto> list = characterService.findCharactersByOwner_Id(ownerId);
        return ResponseEntity.ok(list);
    }

    @PatchMapping("/set-hp/{characterId}")
    public ResponseEntity<CharacterDto> patchHp(
        @PathVariable UUID characterId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @RequestParam(value = "hp", required = false) Integer hpParam,
        @RequestBody(required = false) HpPatchRequest body
    ){
        CharacterDto dto = characterService.patchHp(characterId, hpParam, body, requesterId);
        return ResponseEntity.ok(dto);
    }

}
