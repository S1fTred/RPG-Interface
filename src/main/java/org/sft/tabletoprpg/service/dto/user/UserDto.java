package org.sft.tabletoprpg.service.dto.user;


import lombok.Builder;
import org.sft.tabletoprpg.domain.Role;

import java.util.Set;
import java.util.UUID;

@Builder
public record UserDto (
        UUID id,
        String username,
        String email,
        Set<Role> roles
) {}
