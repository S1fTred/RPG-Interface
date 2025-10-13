package org.sft.tabletoprpg.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sft.tabletoprpg.repo.ItemRepository;
import org.sft.tabletoprpg.service.dto.item.ItemCreateRequest;
import org.sft.tabletoprpg.service.dto.item.ItemDto;
import org.sft.tabletoprpg.service.dto.item.ItemUpdateRequest;
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
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemRepository itemRepository;

    @PostMapping("/create")
    public ResponseEntity<ItemDto> createItem(
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @Valid @RequestBody ItemCreateRequest req,
        UriComponentsBuilder uriBuilder
    ){

    }

    @PatchMapping("/update/{itemId}")
    public ResponseEntity<Void> updateItem(
        @PathVariable UUID itemId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @Valid @RequestBody ItemUpdateRequest req
    ){

    }

    @DeleteMapping("/delete/{itemId}")
    public ResponseEntity<Void> deleteItem(
        @PathVariable UUID itemId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId
    ){

    }

    @GetMapping("/get-item/{itemId}")
    public ItemDto getItemById(@PathVariable UUID itemId){

    }

    @GetMapping
    public List<ItemDto> findItemsByNameContains(
        @RequestParam(name = "query", required = false) String query
    ){

    }

}
