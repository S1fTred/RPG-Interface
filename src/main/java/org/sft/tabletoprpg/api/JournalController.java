package org.sft.tabletoprpg.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sft.tabletoprpg.service.JournalService;
import org.sft.tabletoprpg.service.dto.journal.JournalEntryCreateRequest;
import org.sft.tabletoprpg.service.dto.journal.JournalEntryDto;
import org.sft.tabletoprpg.service.dto.journal.JournalEntryUpdateRequest;
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
@RequestMapping("/api")
@RequiredArgsConstructor
public class JournalController {

    private final JournalService journalService;

    // ---------- CREATE ----------

    // Legacy: POST /api/journals/create/{campaignId}
    // ВНИМАНИЕ: authorId/campaignId в body игнорируются (если вдруг придут от старых клиентов)
    @PostMapping("/journals/create/{campaignId}")
    public ResponseEntity<JournalEntryDto> createJournalLegacy(
        @PathVariable UUID campaignId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @Valid @RequestBody JournalEntryCreateRequest req,
        UriComponentsBuilder uriBuilder
    ){
        JournalEntryDto dto = journalService.createJournal(campaignId, requesterId, req);
        URI location = uriBuilder.path("/api/campaigns/{cid}/journal/{id}")
            .buildAndExpand(dto.campaignId(), dto.id()).toUri();
        return ResponseEntity.created(location).body(dto);
    }

    // Canonical: POST /api/campaigns/{campaignId}/journal
    // Только GM кампании может создавать записи
    @PostMapping("/campaigns/{campaignId}/journal")
    public ResponseEntity<JournalEntryDto> createJournal(
        @PathVariable UUID campaignId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @Valid @RequestBody JournalEntryCreateRequest req,
        UriComponentsBuilder uriBuilder
    ){
        JournalEntryDto dto = journalService.createJournal(campaignId, requesterId, req);
        URI location = uriBuilder.path("/api/campaigns/{cid}/journal/{id}")
            .buildAndExpand(dto.campaignId(), dto.id()).toUri();
        return ResponseEntity.created(location).body(dto);
    }

    // Personal: POST /api/journals
    @PostMapping("/journals")
    public ResponseEntity<JournalEntryDto> createPersonalJournal(
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @Valid @RequestBody JournalEntryCreateRequest req,
        UriComponentsBuilder uriBuilder
    ){
        JournalEntryDto dto = journalService.createPersonal(requesterId, req);
        URI location = uriBuilder.path("/api/journals/{id}").buildAndExpand(dto.id()).toUri();
        return ResponseEntity.created(location).body(dto);
    }

    // ---------- UPDATE ----------

    // Legacy: PATCH /api/journals/update/{entryId}
    @PatchMapping("/journals/update/{entryId}")
    public ResponseEntity<JournalEntryDto> updateJournalLegacy(
        @PathVariable UUID entryId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @Valid @RequestBody JournalEntryUpdateRequest req
    ){
        return ResponseEntity.ok(journalService.updateJournal(entryId, requesterId, req));
    }

    // Canonical: PATCH /api/campaigns/{campaignId}/journal/{entryId}
    // campaignId используется для читаемого URL; сама запись привязана к своей кампании
    @PatchMapping("/campaigns/{campaignId}/journal/{entryId}")
    public ResponseEntity<JournalEntryDto> updateJournal(
        @PathVariable UUID campaignId,
        @PathVariable UUID entryId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @Valid @RequestBody JournalEntryUpdateRequest req
    ){
        return ResponseEntity.ok(journalService.updateJournal(entryId, requesterId, req));
    }

    // ---------- DELETE ----------

    // Legacy: DELETE /api/journals/delete/{entryId}
    @DeleteMapping("/journals/delete/{entryId}")
    public ResponseEntity<Void> deleteJournalLegacy(
        @PathVariable UUID entryId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId
    ){
        journalService.deleteJournal(entryId, requesterId);
        return ResponseEntity.noContent().build();
    }

    // Canonical: DELETE /api/campaigns/{campaignId}/journal/{entryId}
    @DeleteMapping("/campaigns/{campaignId}/journal/{entryId}")
    public ResponseEntity<Void> deleteJournal(
        @PathVariable UUID campaignId,
        @PathVariable UUID entryId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId
    ){
        journalService.deleteJournal(entryId, requesterId);
        return ResponseEntity.noContent().build();
    }

    // ---------- READ ----------

    // Legacy: GET /api/journals/list-journals/{campaignId}
    @GetMapping("/journals/list-journals/{campaignId}")
    public ResponseEntity<List<JournalEntryDto>> listJournalLegacy(
        @PathVariable UUID campaignId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @RequestParam(name = "type", required = false) String type,
        @RequestParam(name = "onlyPlayersVisible", required = false) Boolean onlyPlayersVisible
    ){
        return ResponseEntity.ok(
            journalService.listJournals(campaignId, requesterId, type, onlyPlayersVisible)
        );
    }

    // Canonical: GET /api/campaigns/{campaignId}/journal?type=...&include=all
    @GetMapping("/campaigns/{campaignId}/journal")
    public ResponseEntity<List<JournalEntryDto>> listJournal(
        @PathVariable UUID campaignId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId,
        @RequestParam(name = "type", required = false) String type,
        @RequestParam(name = "include", required = false) String include
    ){
        // include=all → для GM показать все; иначе игрокам только PLAYERS
        Boolean onlyPlayersVisible = (include == null || !"all".equalsIgnoreCase(include));
        return ResponseEntity.ok(
            journalService.listJournals(campaignId, requesterId, type, onlyPlayersVisible)
        );
    }

    // Canonical: GET /api/campaigns/{campaignId}/journal/{entryId}
    @GetMapping("/campaigns/{campaignId}/journal/{entryId}")
    public ResponseEntity<JournalEntryDto> getJournalById(
        @PathVariable UUID campaignId,
        @PathVariable UUID entryId,
        @AuthenticationPrincipal(expression = "id") UUID requesterId
    ){
        return ResponseEntity.ok(
            journalService.getJournalById(entryId, requesterId)
        );
    }

    // Personal: GET /api/journals/me
    @GetMapping("/journals/me")
    public ResponseEntity<List<JournalEntryDto>> listMyJournals(
        @AuthenticationPrincipal(expression = "id") UUID requesterId
    ){
        return ResponseEntity.ok(journalService.listPersonal(requesterId));
    }
}
