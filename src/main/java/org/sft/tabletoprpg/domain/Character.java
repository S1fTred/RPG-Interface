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
@Check(constraints = "strength BETWEEN 1 AND 30 AND " +
        "agility BETWEEN 1 AND 30 AND " +
        "stamina BETWEEN 1 AND 30 AND " +
        "intelligence BETWEEN 1 AND 30 AND " +
        "wisdom BETWEEN 1 AND 30 AND " +
        "charisma BETWEEN 1 AND 30")
@Entity
@Table(name = "characters",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"campaign_id", "name"})
        },
        indexes = {
                @Index(name = "idx_characters_owner_id", columnList = "owner_id"),
                @Index(name = "idx_characters_campaign_id", columnList = "campaign_id")
        })
public class Character {

    @Id
    @Column(nullable = false, updatable = false)
    @EqualsAndHashCode.Include
    private UUID id;

    @Column(nullable=false, length=100)
    @NotBlank(message = "Имя персонажа не должно быть пустым")
    private String name;

    @Column(name = "clazz", nullable=false, length=50)
    @NotBlank(message = "Класс персонажа не должен быть пустым")
    private String clazz;

    @Column(nullable=false, length=50)
    @NotBlank(message = "Раса персонажа не должна быть пустой")
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
            @AttributeOverride(name = "attr_str",     column = @Column(name = "strength", nullable = false)),
            @AttributeOverride(name = "attr_agi",    column = @Column(name = "agility", nullable = false)),
            @AttributeOverride(name = "attr_stam", column = @Column(name = "stamina", nullable = false)),
            @AttributeOverride(name = "attr_int", column = @Column(name = "intelligence", nullable = false)),
            @AttributeOverride(name = "attr_wis",       column = @Column(name = "wisdom", nullable = false)),
            @AttributeOverride(name = "attr_cha",     column = @Column(name = "charisma", nullable = false))
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
