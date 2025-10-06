package org.sft.tabletoprpg.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.Check;

import java.math.BigDecimal;
import java.util.UUID;


@ToString
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@NoArgsConstructor @AllArgsConstructor
@Check(constraints = "(price >= 0) AND (weight >= 0)")
@Entity
@Table(name = "items")
public class Item {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false, length = 100)
    @NotBlank(message = "Item name should not be blank")
    private String name;

    @Lob
    private String description;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal weight;

    @Column(name = "price", scale = 2, nullable = false)
    private Integer price;


    @PrePersist
    public void prePersist(){
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
    }
}
