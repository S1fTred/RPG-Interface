package org.sft.tabletoprpg.service;

import org.sft.tabletoprpg.service.dto.user.UserDto;
import org.sft.tabletoprpg.service.dto.user.UserRegisterRequest;

import java.util.UUID;


public interface UserService {

    UserDto createUser(UserRegisterRequest req);

    UserDto findUserById(UUID id);

    UserDto findByUsername(String username);

    void deleteUser(UUID id);

    java.util.List<UserDto> findAll();
}
