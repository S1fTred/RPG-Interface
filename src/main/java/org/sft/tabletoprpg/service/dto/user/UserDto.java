package org.sft.tabletoprpg.service.dto;


import org.sft.tabletoprpg.domain.Role;

import java.util.Set;
import java.util.UUID;

public record UserDto (
        UUID id,
        String username,
        String email,
        Set<Role> roles
) {}
