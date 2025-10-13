package org.sft.tabletoprpg.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "security.jwt")
public record JwtProperties(
    String secret,     // секрет для HS256
    String accessTtl,  // ISO-8601 duration: "900s", "15m", "PT15M"
    String refreshTtl  // например "7d", "P7D"
) {}
