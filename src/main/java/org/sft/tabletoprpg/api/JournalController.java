package org.sft.tabletoprpg.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sft.tabletoprpg.service.JournalService;
import org.sft.tabletoprpg.service.dto.journal.JournalEntryCreateRequest;
import org.sft.tabletoprpg.service.dto.journal.JournalEntryDto;
import org.sft.tabletoprpg.service.dto.journal.JournalEntryUpdateRequest;
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
@RequestMapping("/api/journals")
@RequiredArgsConstructor
public class JournalController {

    private final JournalService journalService;

    @PostMapping("/create/{campaignId}")
    public ResponseEntity<JournalEntryDto> createJournal(
        @PathVariable UUID campaignId,
        @AuthenticationPrincipal(expression = "id") UUID gmId,
        @Valid @RequestBody JournalEntryCreateRequest req,
        UriComponentsBuilder uriBuilder
    ){
        if (req.campaignId() != null && !campaignId.equals(req.campaignId())) {
            throw new BadRequestException("campaignId в path и body должны совпадать");
        }
        JournalEntryDto journalEntryDto = journalService.createJournal(campaignId, gmId, req);
        URI location = uriBuilder
            .path("/api/journal-entries/{id}")
            .buildAndExpand(journalEntryDto.id())
            .toUri();
        return ResponseEntity.created(location).body(journalEntryDto);
    }

    @PatchMapping("/update/{entryId}")
    public ResponseEntity<JournalEntryDto> updateJournal(
        @PathVariable UUID entryId,
        @AuthenticationPrincipal(expression = "id") UUID gmId,
        @Valid @RequestBody JournalEntryUpdateRequest req
    ){
        JournalEntryDto journalEntryDto = journalService.updateJournal(entryId, gmId, req);
        return ResponseEntity.ok(journalEntryDto);
    }

    @DeleteMapping("/delete/{entryId}")
    public ResponseEntity<Void> deleteJournal(
        @PathVariable UUID entryId,
        @AuthenticationPrincipal(expression = "id") UUID gmId
    ){
        journalService.deleteJournal(entryId, gmId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/list-journals/{campaignId}")
    public ResponseEntity<List<JournalEntryDto>> listJournal(
        @PathVariable UUID campaignId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @RequestParam(name = "type", required = false) String type,
        @RequestParam(name = "onlyPlayersVisible", required = false) Boolean onlyPlayersVisible
    ){
        List<JournalEntryDto> list = journalService.listJournals(campaignId, requesterId, type, onlyPlayersVisible);
        return ResponseEntity.ok(list);
    }




}
