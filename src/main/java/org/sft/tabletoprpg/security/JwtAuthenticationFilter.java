package org.sft.tabletoprpg.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.sft.tabletoprpg.repo.UserRepository;
import org.sft.tabletoprpg.security.UserPrincipal;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();
    private static final List<String> WHITELIST = List.of(
        "/", "/index.html", "/favicon.ico",
        "/styles.css", "/app.js",
        "/assets/**", "/**/*.css", "/**/*.js",
        "/**/*.png", "/**/*.jpg", "/**/*.svg", "/**/*.woff", "/**/*.woff2",
        "/auth/**", "/error", "/h2-console/**", "/actuator/**"
    );

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Пропускаем preflight и белый список
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
        String uri = request.getRequestURI();
        for (String pattern : WHITELIST) {
            if (PATH_MATCHER.match(pattern, uri)) {
                return true;
            }
        }
        return false;
    }

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
            } catch (Exception ignored) {
                // оставляем контекст неаутентифицированным — дальше сработает 401/403 по правилам
            }
        }
        chain.doFilter(req, res);
    }
}
