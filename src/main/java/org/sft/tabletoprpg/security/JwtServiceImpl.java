package org.sft.tabletoprpg.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;

@Service
@RequiredArgsConstructor
public class JwtServiceImpl implements JwtService {

    private final JwtProperties props;

    private SecretKey key() {
        // секрет должен быть ≥ 32 байт для HS256
        return Keys.hmacShaKeyFor(props.secret().getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public String generateAccessToken(UserPrincipal p) {
        return buildToken(p, parseDuration(props.accessTtl()));
    }

    @Override
    public String generateRefreshToken(UserPrincipal p) {
        return buildToken(p, parseDuration(props.refreshTtl()));
    }

    private String buildToken(UserPrincipal p, Duration ttl) {
        Instant now = Instant.now();
        return Jwts.builder()
            .setSubject(p.getUsername())               // sub
            .claim("userId", p.getId().toString())     // кастомный клейм
            .claim("roles", p.getAuthorities().stream()
                .map(a -> a.getAuthority()).toList())
            .setIssuedAt(Date.from(now))               // iat
            .setExpiration(Date.from(now.plus(ttl)))   // exp
            .signWith(key(), SignatureAlgorithm.HS256)
            .compact();
    }

    @Override
    public Claims parseAndValidate(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(key())
            .build()
            .parseClaimsJws(token)
            .getBody();
    }

    private Duration parseDuration(String s) {
        // поддержка "900s" / "15m" / "7d" и т.п. + стандартный ISO-8601
        if (s == null || s.isBlank()) return Duration.ofMinutes(15);
        try {
            if (s.endsWith("s")) return Duration.ofSeconds(Long.parseLong(s.substring(0, s.length()-1)));
            if (s.endsWith("m")) return Duration.ofMinutes(Long.parseLong(s.substring(0, s.length()-1)));
            if (s.endsWith("h")) return Duration.ofHours(Long.parseLong(s.substring(0, s.length()-1)));
            if (s.endsWith("d")) return Duration.ofDays(Long.parseLong(s.substring(0, s.length()-1)));
            return Duration.parse(s); // ISO-8601: "PT15M", "P7D"
        } catch (Exception e) {
            return Duration.ofMinutes(15);
        }
    }
}
