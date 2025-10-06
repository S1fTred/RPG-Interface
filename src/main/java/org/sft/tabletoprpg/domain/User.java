package org.sft.tabletoprpg.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;



@Getter @Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"username", "email"})
})
@ToString(exclude = {"passwordHash"})
@Builder
public class User {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false, unique = true, length = 30)
    @NotBlank(message = "Username should not be blank")
    @Size(min = 3, max = 30)
    private String username;

    @Column(nullable = false, unique = true)
    @NotBlank(message = "Email should not be blank")
    @Email
    private String email;

    @Column(nullable=false)
    @NotBlank(message = "Password should not be blank")
    private String passwordHash;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "role_name", nullable = false)
    private Set<Role> roles = new HashSet<>();

    @CreationTimestamp
    @Column(nullable = false, insertable = true, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false, insertable = false, updatable = true)
    private Instant updatedAt;


    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
    }



}
