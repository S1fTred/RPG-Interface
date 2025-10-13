package org.sft.tabletoprpg.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sft.tabletoprpg.domain.Item;
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

    @PostMapping("/crt")
    public ResponseEntity<ItemDto> createItem(
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @Valid @RequestBody ItemCreateRequest req,
        UriComponentsBuilder uriBuilder
    ){
        ItemDto ItemDto = itemService.createItem(req, requesterId);
        URI location = uriBuilder.path("/api/items/{id}")
            .buildAndExpand(ItemDto.id())
            .toUri();
        return ResponseEntity.created(location).body(ItemDto);
    }

    @PatchMapping("/updt/{itemId}")
    public ResponseEntity<Void> updateItem(
        @PathVariable UUID itemId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @Valid @RequestBody ItemUpdateRequest req
    ){
        itemService.updateItem(itemId, req, requesterId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/dlt/{itemId}")
    public ResponseEntity<Void> deleteItem(
        @PathVariable UUID itemId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId
    ){
        itemService.deleteItem(itemId, requesterId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/item-by-id/{itemId}")
    public ResponseEntity<ItemDto> getItemById(@PathVariable UUID itemId){
        ItemDto itemDto = itemService.getItem(itemId);
        return ResponseEntity.ok(itemDto);
    }

    @GetMapping("/items-by-name-contains")
    public ResponseEntity<List<ItemDto>> findItemsByNameContains(
        @RequestParam(name = "query", required = false) String query
    ){
        List<ItemDto> list = itemService.findByName(query);
        return ResponseEntity.ok(list);
    }

}
