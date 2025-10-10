package org.sft.tabletoprpg.service.dto.item;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Builder
public record ItemDto(

        UUID id,
        String name,
        String description,
        BigDecimal weight,
        Integer price,
        Instant createdAt
) { }
