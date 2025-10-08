package org.sft.tabletoprpg.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

import static jakarta.persistence.FetchType.LAZY;

@ToString
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@NoArgsConstructor @AllArgsConstructor
@Entity
@Builder
@Table(name = "campaigns",
        uniqueConstraints = {@UniqueConstraint(columnNames = {"name"})},
        indexes = {@Index(name = "idx_campaigns_gm", columnList = "gm_id")})
public class Campaign {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false)
    @NotBlank(message = "Title of campaign should not be blank")
    private String name;

    @Lob
    private String description;

    @ManyToOne(fetch = LAZY, optional = false)
    @JoinColumn(name = "gm_id", nullable = false)
    private User gm;

    @CreationTimestamp
    @Column(nullable = false,  updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void  prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }

    }
}
