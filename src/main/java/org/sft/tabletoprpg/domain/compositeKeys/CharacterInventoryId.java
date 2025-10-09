package org.sft.tabletoprpg.domain.compositeKeys;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class CharacterInventoryId implements Serializable {
    @Column(name = "character_id", nullable = false)
    private UUID characterId;

    @Column(name = "item_id", nullable = false)
    private UUID itemId;
}