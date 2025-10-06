package org.sft.tabletoprpg.domain;

import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;

@Embeddable
@ToString
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Atributes {

    @Min(8)
    @Max(20)
    private int strength, dexterity, constitution, intelligence, wisdom, charisma;
}
