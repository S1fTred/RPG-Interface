package org.sft.tabletoprpg.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.sft.tabletoprpg.security.*;
import org.sft.tabletoprpg.service.UserService;
import org.sft.tabletoprpg.service.dto.auth.*;
import org.sft.tabletoprpg.service.dto.user.*;
import org.sft.tabletoprpg.service.exception.BadRequestException;
import org.springframework.http.*;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@Validated
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;             // для регистрации (createUser)
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@Valid @RequestBody UserRegisterRequest req) {
        // Используем твою существующую бизнес-логику:
        var user = userService.createUser(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        var ud = userDetailsService.loadUserByUsername(req.usernameOrEmail());
        if (!(ud instanceof UserPrincipal p)) {
            throw new BadRequestException("Bad principal type");
        }
        if (!encoder.matches(req.password(), p.getPassword())) {
            throw new BadRequestException("Invalid credentials");
        }
        var access = jwtService.generateAccessToken(p);
        // при необходимости — выдать рефреш:
        var refresh = jwtService.generateRefreshToken(p);

        return ResponseEntity.ok(new LoginResponse(access, refresh));
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@Valid @RequestBody RefreshTokenRequest req) {
        var claims = jwtService.parseAndValidate(req.refreshToken());
        var userId = claims.get("userId", String.class);
        if (userId == null) throw new BadRequestException("Invalid refresh token");

        // Собери UserPrincipal (как в фильтре):
        var p = new UserPrincipal(java.util.UUID.fromString(userId),
            claims.getSubject(), // username
            "N/A", java.util.List.of() // пароль и роли можно перезагрузить из БД при желании
        );
        // Лучше перезагрузить пользователя из БД по userId и сделать UserPrincipal.from(user).
        // Явно:
        // var user = userRepository.findById(UUID.fromString(userId)).orElseThrow(...);
        // var p = UserPrincipal.from(user);

        var newAccess = jwtService.generateAccessToken(p);
        // при необходимости — выдать новый refresh (или вернуть тот же):
        var newRefresh = jwtService.generateRefreshToken(p);

        return ResponseEntity.ok(new LoginResponse(newAccess, newRefresh));
    }
}
