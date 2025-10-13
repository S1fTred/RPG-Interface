package org.sft.tabletoprpg.service.dto.auth;

public record LoginResponse(
    String accessToken,
    String refreshToken // можно вернуть null, если не используешь
) {}
