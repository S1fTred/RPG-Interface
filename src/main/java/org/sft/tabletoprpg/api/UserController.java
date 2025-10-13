package org.sft.tabletoprpg.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sft.tabletoprpg.domain.User;
import org.sft.tabletoprpg.service.UserService;
import org.sft.tabletoprpg.service.dto.user.UserDto;
import org.sft.tabletoprpg.service.dto.user.UserRegisterRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@Validated
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/crt")
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody UserRegisterRequest userRequest){
        UserDto userDto = userService.createUser(userRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(userDto);
    }

    @DeleteMapping("/dlt/{id}")
    public ResponseEntity<Void> deleteUserById(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable UUID id) {
        UserDto userDto = userService.findUserById(id);
        return ResponseEntity.ok(userDto);
    }

    @GetMapping("/by-username")
    public ResponseEntity<UserDto> getUserByUsername(@RequestParam("username") String name) {
        UserDto userDto = userService.findByUsername(name);
        return ResponseEntity.ok(userDto);
    }







}
