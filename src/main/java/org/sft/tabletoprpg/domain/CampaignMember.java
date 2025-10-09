package org.sft.tabletoprpg.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import static jakarta.persistence.FetchType.LAZY;

@ToString
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@NoArgsConstructor @AllArgsConstructor
@Entity
@Builder
@Table(name = "campaign_members",  uniqueConstraints = {
        @UniqueConstraint(columnNames = {"campaign_id", "user_id"})
})
public class CampaignMember {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = LAZY, optional = false)
    @JoinColumn(name = "campaign_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Campaign campaign;

    @ManyToOne(fetch = LAZY,  optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CampaignRole roleInCampaign;

    @Column(nullable = false)
    private Instant joinedAt;


    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.joinedAt == null) {
            this.joinedAt = Instant.now();
        }
    }

}
