package org.sft.tabletoprpg.config;

import org.springframework.boot.autoconfigure.security.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // доступ к H2 Console без аутентификации
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PathRequest.toH2Console()).permitAll()
                        .anyRequest().permitAll()   // пока всё остальное тоже открыто
                )
                // H2 console работает во фрейме -> разрешаем
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
                // для H2 console отключаем CSRF
                .csrf(csrf -> csrf.ignoringRequestMatchers(PathRequest.toH2Console()));

        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}