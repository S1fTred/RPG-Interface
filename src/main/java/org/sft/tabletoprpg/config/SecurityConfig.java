package org.sft.tabletoprpg.config;

import lombok.RequiredArgsConstructor;
import org.sft.tabletoprpg.repo.UserRepository;
import org.sft.tabletoprpg.security.JwtAuthenticationFilter;
import org.sft.tabletoprpg.security.JwtProperties;
import org.sft.tabletoprpg.security.JwtService;
import org.springframework.boot.autoconfigure.security.servlet.PathRequest;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
@EnableConfigurationProperties(JwtProperties.class)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        var jwtFilter = new JwtAuthenticationFilter(jwtService, userRepository);

        http
            .csrf(csrf -> csrf
                // H2 и auth-эндпоинты не требуют CSRF
                .ignoringRequestMatchers("/h2-console/**", "/auth/**")
                .disable()
            )
            .cors(Customizer.withDefaults())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // ВАЖНО: все requestMatchers идут ДО anyRequest()
            .authorizeHttpRequests(auth -> auth
                // стандартные статические ресурсы (/css, /js, /images и т.п.)
                .requestMatchers(PathRequest.toStaticResources().atCommonLocations()).permitAll()

                // наш статики набор + index.html
                .requestMatchers(HttpMethod.GET,
                    "/",
                    "/index.html",
                    "/favicon.ico",
                    // Статика SPA (конкретные файлы и каталоги без использования **.ext, т.к. PathPattern не допускает хвост после **)
                    "/styles.css",
                    "/store.js", "/api.js", "/router.js", "/app.js",
                    "/views/**",
                    "/assets/**",
                    "/css/**", "/js/**"
                ).permitAll()

                // публичные эндпоинты
                .requestMatchers("/auth/**", "/error", "/h2-console/**").permitAll()

                // права
                .requestMatchers("/api/items/**").hasRole("ADMIN")
                .requestMatchers("/api/**").authenticated()

                // и только ПОСЛЕ всего — общее правило
                .anyRequest().permitAll()
            )

            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, e) -> { // 401
                    res.setStatus(HttpStatus.UNAUTHORIZED.value());
                    res.setContentType("application/json");
                    res.getWriter().write("""
                        {"error":"unauthorized","message":"Authentication required"}
                        """);
                })
                .accessDeniedHandler((req, res, e) -> { // 403
                    res.setStatus(HttpStatus.FORBIDDEN.value());
                    res.setContentType("application/json");
                    res.getWriter().write("""
                        {"error":"forbidden","message":"Access denied"}
                        """);
                })
            )

            // H2-консоль в iframe
            .headers(h -> h.frameOptions(f -> f.disable()))

            // JWT фильтр до UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        var cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of(
            "http://localhost:8080",
            "http://127.0.0.1:8080",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
        ));
        cfg.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        cfg.setAllowedHeaders(List.of("Authorization","Content-Type","Accept"));
        cfg.setAllowCredentials(false);

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }
}
