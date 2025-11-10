package org.sft.tabletoprpg.service.exception;

/**
 * Для ошибок авторизации (401), например, неверный логин или пароль
 */
public class AuthException extends RuntimeException {
    public AuthException(String message) { super(message); }
}
