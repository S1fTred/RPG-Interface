package org.sft.tabletoprpg.service.dto.character;

public record HpPatchRequest(
    Integer set,   // абсолютное значение HP
    Integer delta  // относительное изменение HP (опционально)
) {}
