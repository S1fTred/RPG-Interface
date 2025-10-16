package org.sft.tabletoprpg.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sft.tabletoprpg.service.ItemService;
import org.sft.tabletoprpg.service.dto.item.ItemCreateRequest;
import org.sft.tabletoprpg.service.dto.item.ItemDto;
import org.sft.tabletoprpg.service.dto.item.ItemUpdateRequest;
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
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;

    // --------- CREATE ----------
    // Legacy: POST /api/items/crt
    @PostMapping("/crt")
    public ResponseEntity<ItemDto> createItemLegacy(
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @Valid @RequestBody ItemCreateRequest req,
        UriComponentsBuilder uriBuilder
    ){
        ItemDto dto = itemService.createItem(req, requesterId);
        URI location = uriBuilder.path("/api/items/{id}").buildAndExpand(dto.id()).toUri();
        return ResponseEntity.created(location).body(dto);
    }

    // Canonical: POST /api/items
    @PostMapping
    public ResponseEntity<ItemDto> createItem(
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @Valid @RequestBody ItemCreateRequest req,
        UriComponentsBuilder uriBuilder
    ){
        ItemDto dto = itemService.createItem(req, requesterId);
        URI location = uriBuilder.path("/api/items/{id}").buildAndExpand(dto.id()).toUri();
        return ResponseEntity.created(location).body(dto);
    }

    // --------- UPDATE ----------
    // Legacy: PATCH /api/items/updt/{itemId}
    @PatchMapping("/updt/{itemId}")
    public ResponseEntity<Void> updateItemLegacy(
        @PathVariable UUID itemId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @Valid @RequestBody ItemUpdateRequest req
    ){
        itemService.updateItem(itemId, req, requesterId);
        return ResponseEntity.noContent().build();
    }

    // Canonical: PATCH /api/items/{itemId}
    @PatchMapping("/{itemId}")
    public ResponseEntity<Void> updateItem(
        @PathVariable UUID itemId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @Valid @RequestBody ItemUpdateRequest req
    ){
        itemService.updateItem(itemId, req, requesterId);
        return ResponseEntity.noContent().build();
    }

    // --------- DELETE ----------
    // Legacy: DELETE /api/items/dlt/{itemId}
    @DeleteMapping("/dlt/{itemId}")
    public ResponseEntity<Void> deleteItemLegacy(
        @PathVariable UUID itemId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId
    ){
        itemService.deleteItem(itemId, requesterId);
        return ResponseEntity.noContent().build();
    }

    // Canonical: DELETE /api/items/{itemId}
    @DeleteMapping("/{itemId}")
    public ResponseEntity<Void> deleteItem(
        @PathVariable UUID itemId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId
    ){
        itemService.deleteItem(itemId, requesterId);
        return ResponseEntity.noContent().build();
    }

    // --------- READ ----------
    // Legacy: GET /api/items/item-by-id/{itemId}
    @GetMapping("/item-by-id/{itemId}")
    public ResponseEntity<ItemDto> getItemByIdLegacy(@PathVariable UUID itemId){
        return ResponseEntity.ok(itemService.getItem(itemId));
    }

    // Canonical: GET /api/items/{itemId}
    @GetMapping("/{itemId}")
    public ResponseEntity<ItemDto> getItemById(@PathVariable UUID itemId){
        return ResponseEntity.ok(itemService.getItem(itemId));
    }

    // Legacy: GET /api/items/items-by-name-contains?query=...
    @GetMapping("/items-by-name-contains")
    public ResponseEntity<List<ItemDto>> findItemsByNameContainsLegacy(
        @RequestParam(name = "query", required = false) String query
    ){
        return ResponseEntity.ok(itemService.findByName(query));
    }

    // Canonical: GET /api/items?query=...
    @GetMapping(params = "query")
    public ResponseEntity<List<ItemDto>> findItemsByNameContains(
        @RequestParam("query") String query
    ){
        return ResponseEntity.ok(itemService.findByName(query));
    }
}
