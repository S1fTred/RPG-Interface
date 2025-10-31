package org.sft.tabletoprpg.repo;

import org.sft.tabletoprpg.domain.Item;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

public interface ItemRepository extends JpaRepository<Item, UUID> {
    boolean existsById(UUID itemId);
    Optional<Item> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
    List<Item> findByNameContainingIgnoreCase(String name);
}
