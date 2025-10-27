// js/auth.js — логин/регистрация с событиями и нормальными ошибками

import { api, setAuth, getUser, logout, restoreSession } from './api.js';

/**
 * Вход: вызывает /auth/login, сохраняет токены/пользователя, шлёт событие 'auth:login'
 */
export async function login(username, password) {
    const data = await api.post('/auth/login', { username, password }); // api бросит Error при !ok
    // ожидаем { accessToken, refreshToken, user }
    setAuth({ access: data.accessToken, refresh: data.refreshToken, user: data.user });
    window.dispatchEvent(new CustomEvent('auth:login', { detail: { user: data.user } }));
    return data;
}

/**
 * Регистрация: /auth/register, затем автоматический login()
 */
export async function register(username, email, password) {
    await api.post('/auth/register', { username, email, password });
    return await login(username, password);
}

/** Текущий пользователь (из localStorage/in-memory) */
export function me() {
    return getUser();
}

/** Выход: чистим auth и шлём событие 'auth:logout' */
export function signout() {
    logout();
    window.dispatchEvent(new CustomEvent('auth:logout'));
}

/**
 * Тихий старт: пытаемся обновить сессию по refreshToken
 * restoreSession() сам обновит токены и user при успехе
 */
export async function boot() {
    await restoreSession();
}

/* Удобные подписчики на события аутентификации (по желанию) */
export function onAuthLogin(handler) {
    window.addEventListener('auth:login', (e) => handler?.(e.detail?.user));
}
export function onAuthLogout(handler) {
    window.addEventListener('auth:logout', () => handler?.());
}
