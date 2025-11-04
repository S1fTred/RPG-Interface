package org.sft.tabletoprpg.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;
import java.util.UUID;


@ToString
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@NoArgsConstructor @AllArgsConstructor
@Entity
@Builder
@Table(name = "journal_entries",
        indexes = {
            @Index(name = "idx_journal_campaign_created_at", columnList = "campaign_id, created_at"),
            @Index(name = "idx_journal_campaign_id", columnList = "campaign_id"),
            @Index(name = "idx_journal_author_id", columnList = "author_id"),
            @Index(name = "idx_journal_campaign_type", columnList = "campaign_id, type")
        }
)

public class JournalEntry {

    @Id
    @Column(nullable = false, updatable = false)
    @EqualsAndHashCode.Include
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "campaign_id", nullable = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Campaign campaign;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id",  nullable = false)
    private User author;

    @Size(max = 50)
    @NotBlank(message = "Тип журнала не должен быть пустым")
    private String type;

    @Enumerated(EnumType.STRING)
    private JournalVisibility visibility;

    @Column(nullable = false, length = 150)
    @NotBlank(message = "Название не должно быть пустым")
    private String title;

    @Lob
    private String content;

    private String tags;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;


    @PrePersist
    public void prePersist(){
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
    }

}
