package org.sft.tabletoprpg.security;

import io.jsonwebtoken.Claims;

public interface JwtService {
    String generateAccessToken(UserPrincipal principal);
    String generateRefreshToken(UserPrincipal principal); // опционально
    Claims parseAndValidate(String token);
}
