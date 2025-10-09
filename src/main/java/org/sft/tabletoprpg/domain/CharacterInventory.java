package org.sft.tabletoprpg.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import lombok.*;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.sft.tabletoprpg.domain.compositeKeys.CharacterInventoryId;


@ToString
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@NoArgsConstructor @AllArgsConstructor
@Check(constraints = "quantity >= 1")
@Entity
@Table(name = "character_inventory",
        uniqueConstraints = {
        @UniqueConstraint(columnNames = {"character_id", "item_id"})
        },
        indexes = {
            @Index(name = "idx_charinv_item", columnList = "item_id"),
            @Index(name = "idx_charinv_character", columnList = "character_id")
        })

public class CharacterInventory {

    @EmbeddedId
    @EqualsAndHashCode.Include
    private CharacterInventoryId id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "character_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @MapsId("characterId")
    private Character character;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    @MapsId("itemId")
    private Item item;

    @Column(nullable = false)
    @Min(1)
    private int quantity;


}
