package org.sft.tabletoprpg.security;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.sft.tabletoprpg.repo.UserRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.UUID;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
        throws ServletException, IOException {

        String header = req.getHeader(HttpHeaders.AUTHORIZATION);

        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                Claims claims = jwtService.parseAndValidate(token);
                String userIdStr = claims.get("userId", String.class);
                if (userIdStr != null) {
                    UUID userId = UUID.fromString(userIdStr);
                    var user = userRepository.findById(userId).orElse(null);
                    if (user != null) {
                        var principal = UserPrincipal.from(user);
                        var auth = new UsernamePasswordAuthenticationToken(
                            principal, null, principal.getAuthorities());
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }
                }
            } catch (Exception e) {
                // Ничего не кидаем: просто оставляем без аутентификации → дальше вернётся 401/403 по правилам
            }
        }
        chain.doFilter(req, res);
    }
}
