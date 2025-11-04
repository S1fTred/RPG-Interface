package org.sft.tabletoprpg.service.impl;



import lombok.RequiredArgsConstructor;
import org.sft.tabletoprpg.domain.Role;
import org.sft.tabletoprpg.domain.User;
import org.sft.tabletoprpg.repo.CampaignRepository;
import org.sft.tabletoprpg.repo.CharacterRepository;
import org.sft.tabletoprpg.repo.JournalEntryRepository;
import org.sft.tabletoprpg.repo.UserRepository;
import org.sft.tabletoprpg.service.UserService;
import org.sft.tabletoprpg.service.dto.user.UserDto;
import org.sft.tabletoprpg.service.dto.user.UserRegisterRequest;
import org.sft.tabletoprpg.service.exception.ConflictException;
import org.sft.tabletoprpg.service.exception.NotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final CampaignRepository campaignRepository;
    private final CharacterRepository characterRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final PasswordEncoder encoder;


    @Transactional
    @Override
    public UserDto createUser(UserRegisterRequest req) {

        final String username = req.username() == null ? null : req.username().trim();
        final String email    = req.email() == null ? null : req.email().trim().toLowerCase();
        final String rawPwd   = req.rawPassword();

        if (username == null || username.isEmpty()) {
            throw new ConflictException("Логин не должен быть пустым");
        }
        if (email == null || email.isEmpty()) {
            throw new ConflictException("Почта не должна быть пустой");
        }
        if (rawPwd == null || rawPwd.isBlank()) {
            throw new ConflictException("Пароль не должен быть пустым");
        }

        if (userRepository.existsByUsername(username)){
            throw new ConflictException("Такой логин уже занят");
        }

        if (userRepository.existsByEmail(email)){
            throw new ConflictException("Такая почта уже занята");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(encoder.encode(rawPwd));
        user.setRoles(Set.of(Role.PLAYER));

        try {
            userRepository.save(user);
        } catch (DataIntegrityViolationException ex) {
            // на случай гонки условий — дубли по уникальным индексам
            throw new ConflictException("Пользователь с таким логином/почтой уже существует");
        }

        return toDto(user);
    }


    @Override
    public void deleteUser(UUID id) {

        User user = userRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));


        if (campaignRepository.existsByGm_Id(id)) {
            throw new ConflictException("Пользователь является GM кампании. Передайте GM-ство или удалите кампанию.");
        }
        if (characterRepository.existsByOwner_Id(id)) {
            throw new ConflictException("Пользователь является владельцем персонажа. Передайте владение или удалите персонажей.");
        }
        if (journalEntryRepository.existsByAuthor_Id(id)) {
            throw new ConflictException("Пользователь является автором записей журнала. Удалите записи или измените автора.");
        }

        try {
            userRepository.delete(user);
        } catch (DataIntegrityViolationException ex) {
            // на случай, если в БД ещё есть неожиданные ссылки (RESTRICT)
            throw new ConflictException("Удаление невозможно из-за связанных данных");
        }
    }


    @Override
    public UserDto findUserById(UUID id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));
        return toDto(user);
    }


    @Override
    public UserDto findByUsername(String usernameRaw) {
        final String username = usernameRaw == null ? null : usernameRaw.trim();
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));
        return toDto(user);
    }

    @Override
    public java.util.List<UserDto> findAll() {
        return userRepository.findAll().stream().map(this::toDto).toList();
    }




    // ----------------------МАППЕРЫ----------------------//
    private UserDto toDto(User user){
        return UserDto.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .roles(user.getRoles())
            .build();
    }
}
