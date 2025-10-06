package org.sft.tabletoprpg.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.util.UUID;


@ToString
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@NoArgsConstructor @AllArgsConstructor
@Builder
@Check(constraints = "level >= 1")
@Check(constraints = "hp >= 0 AND hp <= max_hp")
@Check(constraints = "attr_str BETWEEN 1 AND 30 AND " +
        "attr_dex BETWEEN 1 AND 30 AND " +
        "attr_con BETWEEN 1 AND 30 AND " +
        "attr_int BETWEEN 1 AND 30 AND " +
        "attr_wis BETWEEN 1 AND 30 AND " +
        "attr_cha BETWEEN 1 AND 30")
@Entity
@Table(name = "characters",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"campaign_id", "name"})
        },
        indexes = {
                @Index(name = "idx_characters_owner", columnList = "owner_id"),
                @Index(name = "idx_characters_campaign", columnList = "campaign_id")
        })
public class Character {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(nullable=false, length=100)
    @NotBlank(message = "Character name should not be blank")
    private String name;

    @Column(name = "clazz", nullable=false, length=50)
    @NotBlank(message = "Class should not be blank")
    private String clazz;

    @Column(nullable=false, length=50)
    @NotBlank(message = "Race should not be blank")
    private String race;

    @Column(nullable=false)
    @Min(1)
    private int level;

    @Column(nullable=false)
    @Min(0)
    private int hp;

    @Column(name="max_hp", nullable=false)
    @Min(1)
    private int maxHp;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "strength",     column = @Column(name = "attr_str", nullable = false)),
            @AttributeOverride(name = "dexterity",    column = @Column(name = "attr_dex", nullable = false)),
            @AttributeOverride(name = "constitution", column = @Column(name = "attr_con", nullable = false)),
            @AttributeOverride(name = "intelligence", column = @Column(name = "attr_int", nullable = false)),
            @AttributeOverride(name = "wisdom",       column = @Column(name = "attr_wis", nullable = false)),
            @AttributeOverride(name = "charisma",     column = @Column(name = "attr_cha", nullable = false))
    })
    private Atributes atributes;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="owner_id", nullable=false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="campaign_id", nullable=false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Campaign campaign;


    @PrePersist
    public void prePersist(){
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
    }
}
