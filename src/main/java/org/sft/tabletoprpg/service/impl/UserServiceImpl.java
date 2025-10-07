package org.sft.tabletoprpg.service.impl;



import lombok.RequiredArgsConstructor;
import org.sft.tabletoprpg.domain.Role;
import org.sft.tabletoprpg.domain.User;
import org.sft.tabletoprpg.repo.UserRepository;
import org.sft.tabletoprpg.service.UserService;
import org.sft.tabletoprpg.service.dto.user.UserDto;
import org.sft.tabletoprpg.service.dto.user.UserRegisterRequest;
import org.sft.tabletoprpg.service.exception.ConflictException;
import org.sft.tabletoprpg.service.exception.NotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder encoder;

    @Transactional
    @Override
    public UserDto createUser(UserRegisterRequest req) {

        if (userRepository.existsByUsername(req.username())){
            throw new ConflictException("Такой логин уже занят");
        }

        if (userRepository.existsByEmail(req.email())){
            throw new ConflictException("Такая почта уже занята");
        }

        User user = toEntity(req);

        String hash = encoder.encode(req.rawPassword());
        user.setPasswordHash(hash);

        user.setRoles(Set.of(Role.PLAYER));

        userRepository.save(user);
        return toDto(user);
    }


    @Override
    public void deleteUser(UUID id) {

    }


    @Transactional(readOnly = true)
    @Override
    public UserDto findUserById(UUID id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));
        return toDto(user);
    }


    @Transactional(readOnly = true)
    @Override
    public UserDto findByUsername(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));
        return toDto(user);
    }




    // ----------------------МАППЕРЫ----------------------//
    private User toEntity(UserRegisterRequest req) {
        return User.builder()
            .username(req.username())
            .email(req.email())
            .build();
    }

    private UserDto toDto(User user){
        return UserDto.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .roles(user.getRoles())
            .build();
    }
}
