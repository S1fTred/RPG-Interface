package org.sft.tabletoprpg.repo;

import org.sft.tabletoprpg.domain.CharacterInventory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CharacterItemRepository extends JpaRepository<CharacterInventory, UUID> {

    Optional<CharacterInventory> findByCharacter_IdAndItem_Id(UUID characterId, UUID itemId);
    List<CharacterInventory> findByCharacter_Id(UUID characterId);
    void deleteByCharacter_IdAndItem_Id(UUID characterId, UUID itemId);
}
