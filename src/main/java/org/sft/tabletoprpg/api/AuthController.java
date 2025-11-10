package org.sft.tabletoprpg.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.sft.tabletoprpg.security.*;
import org.sft.tabletoprpg.service.UserService;
import org.sft.tabletoprpg.service.dto.auth.*;
import org.sft.tabletoprpg.service.dto.user.*;
import org.sft.tabletoprpg.service.exception.BadRequestException;
import org.sft.tabletoprpg.service.exception.AuthException;
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
        UserPrincipal p;
        try {
            var ud = userDetailsService.loadUserByUsername(req.usernameOrEmail());
            if (!(ud instanceof UserPrincipal userP)) throw new AuthException("Invalid username or password");
            p = userP;
        } catch (org.springframework.security.core.userdetails.UsernameNotFoundException ex) {
            throw new AuthException("Invalid username or password");
        }
        if (!encoder.matches(req.password(), p.getPassword())) {
            throw new AuthException("Invalid username or password");
        }
        var access = jwtService.generateAccessToken(p);
        // при необходимости — выдать рефреш:
        var refresh = jwtService.generateRefreshToken(p);

        return ResponseEntity.ok(new LoginResponse(access, refresh));
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@Valid @RequestBody RefreshTokenRequest req) {
        var claims = jwtService.parseAndValidate(req.refreshToken());
        var username = claims.getSubject();
        if (username == null || username.isBlank()) {
            throw new BadRequestException("Invalid refresh token");
        }

        var ud = userDetailsService.loadUserByUsername(username);
        if (!(ud instanceof UserPrincipal p)) {
            throw new BadRequestException("Bad principal type");
        }

        var newAccess = jwtService.generateAccessToken(p);
        var newRefresh = jwtService.generateRefreshToken(p); // если у тебя одноразовый refresh — ок; если многоразовый — можешь вернуть старый

        return ResponseEntity.ok(new LoginResponse(newAccess, newRefresh));
    }
}
