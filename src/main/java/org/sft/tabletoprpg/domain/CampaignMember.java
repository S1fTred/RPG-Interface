package org.sft.tabletoprpg.domain;

import jakarta.persistence.*;

import java.time.Instant;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.sft.tabletoprpg.domain.compositeKeys.CampaignMemberId;

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
    },
    indexes = {
        @Index(name = "idx_campaign_members_user", columnList = "user_id"),
        @Index(name = "idx_campaign_members_campaign", columnList = "campaign_id")
    })
public class CampaignMember {

    @EmbeddedId
    @EqualsAndHashCode.Include
    private CampaignMemberId id;

    @ManyToOne(fetch = LAZY, optional = false)
    @JoinColumn(name = "campaign_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @MapsId("campaignId")
    private Campaign campaign;

    @ManyToOne(fetch = LAZY,  optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @MapsId("userId")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CampaignRole roleInCampaign;

    @Column(nullable = false, updatable = false)
    @CreationTimestamp
    private Instant joinedAt;



}
