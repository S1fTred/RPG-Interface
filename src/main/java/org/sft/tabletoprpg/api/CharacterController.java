package org.sft.tabletoprpg.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sft.tabletoprpg.service.CharacterService;
import org.sft.tabletoprpg.service.dto.character.CharacterCreateRequest;
import org.sft.tabletoprpg.service.dto.character.CharacterDto;
import org.sft.tabletoprpg.service.exception.BadRequestException;
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
@RequestMapping("/api/characters")
@RequiredArgsConstructor
public class CharacterController {

    private final CharacterService characterService;

    @PostMapping("/create/{campaignId}")
    public ResponseEntity<CharacterDto> createCharacter(
        @PathVariable UUID campaignId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @Valid @RequestBody CharacterCreateRequest req,
        UriComponentsBuilder uriBuilder
    ){
        if (!campaignId.equals(req.campaignId())){
            throw new BadRequestException("Кампании не соответствуют");
        }


    }

    @GetMapping("/by-campaign-id/{campaignId}")
    public List<CharacterDto> listByCampaign(@PathVariable UUID campaignId){

    }

    @GetMapping("/by-owner-id/{ownerId}")
    public List<CharacterDto> listByOwner(@PathVariable UUID ownerId){

    }

    @PatchMapping("/set-hp/{characterId}")
    public CharacterDto setHp(
        @PathVariable UUID characterId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @RequestParam("hp") int
    ){

    }

}
