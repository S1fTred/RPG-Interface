package org.sft.tabletoprpg.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sft.tabletoprpg.service.InventoryService;
import org.sft.tabletoprpg.service.dto.inventory.CharacterInventoryEntryDto;
import org.sft.tabletoprpg.service.dto.inventory.InventoryChangeRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@Validated
@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;


    @GetMapping("/{characterId}")
    public ResponseEntity<List<CharacterInventoryEntryDto>> getInventory(
        @PathVariable UUID characterId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId
    ){
        List<CharacterInventoryEntryDto> list = inventoryService.getInventoryByCharacter(characterId, requesterId);
        return ResponseEntity.ok(list);
    }


    @PostMapping("/change")
    public ResponseEntity<Void> changeQuantity(
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @Valid @RequestBody InventoryChangeRequest req
    ){
        inventoryService.changeQuantity(req, requesterId);
        return ResponseEntity.noContent().build();
    }


}
