package org.sft.tabletoprpg.service.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserRegisterRequest(
        @NotBlank String username,
        @Email @NotBlank String email,
        @Size(min = 6, max = 100) @NotBlank String rawPassword
) {}
