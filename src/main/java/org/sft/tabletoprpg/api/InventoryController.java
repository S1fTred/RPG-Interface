package org.sft.tabletoprpg.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sft.tabletoprpg.service.InventoryService;
import org.sft.tabletoprpg.service.dto.inventory.CharacterInventoryEntryDto;
import org.sft.tabletoprpg.service.dto.inventory.InventoryChangeRequest;
import org.sft.tabletoprpg.service.dto.inventory.InventoryQuantityRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@Validated
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    // --------- READ ----------
    // Legacy: GET /api/inventory/{characterId}
    @GetMapping("/inventory/{characterId}")
    public ResponseEntity<List<CharacterInventoryEntryDto>> getInventoryLegacy(
        @PathVariable UUID characterId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId
    ){
        return ResponseEntity.ok(inventoryService.getInventoryByCharacter(characterId, requesterId));
    }

    // Canonical: GET /api/characters/{characterId}/inventory
    @GetMapping("/characters/{characterId}/inventory")
    public ResponseEntity<List<CharacterInventoryEntryDto>> getInventory(
        @PathVariable UUID characterId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId
    ){
        return ResponseEntity.ok(inventoryService.getInventoryByCharacter(characterId, requesterId));
    }

    // --------- MUTATIONS ----------
    // Legacy: POST /api/inventory/change  (delta-based)
    @PostMapping("/inventory/change")
    public ResponseEntity<Void> changeQuantity(
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @Valid @RequestBody InventoryChangeRequest req
    ){
        inventoryService.changeQuantity(req, requesterId);
        return ResponseEntity.noContent().build();
    }

    // Canonical: GIVE -> POST /api/characters/{characterId}/inventory
    @PostMapping("/characters/{characterId}/inventory")
    public ResponseEntity<Void> giveItem(
        @PathVariable UUID characterId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @Valid @RequestBody InventoryQuantityRequest req // itemId + quantity >= 1
    ){
        inventoryService.giveItem(characterId, req.itemId(), req.quantity(), requesterId);
        return ResponseEntity.noContent().build();
    }

    // Canonical: SET -> PATCH /api/characters/{characterId}/inventory/{itemId}
    @PatchMapping("/characters/{characterId}/inventory/{itemId}")
    public ResponseEntity<Void> setQuantity(
        @PathVariable UUID characterId,
        @PathVariable UUID itemId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @Valid @RequestBody InventoryQuantityRequest req // quantity >= 0
    ){
        inventoryService.setQuantity(characterId, itemId, req.quantity(), requesterId);
        return ResponseEntity.noContent().build();
    }

    // Canonical: CONSUME -> DELETE /api/characters/{characterId}/inventory/{itemId}
    // Если body не передан — удалить полностью. Если есть body.quantity — списать столько.
    @DeleteMapping("/characters/{characterId}/inventory/{itemId}")
    public ResponseEntity<Void> removeOrConsume(
        @PathVariable UUID characterId,
        @PathVariable UUID itemId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @RequestBody(required = false) InventoryQuantityRequest req
    ){
        if (req == null) {
            inventoryService.removeItem(characterId, itemId, requesterId); // удалить полностью
        } else {
            inventoryService.consumeItem(characterId, itemId, req.quantity(), requesterId); // списать часть
        }
        return ResponseEntity.noContent().build();
    }
}
