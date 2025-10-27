// js/auth.js — логин/регистрация с событиями и нормальными ошибками

import { api, setAuth, getUser, logout, restoreSession } from './api.js';

/** Вход */
export async function login(username, password) {
    const data = await api.post('/auth/login', { username, password });
    setAuth({ access: data.accessToken, refresh: data.refreshToken, user: data.user });
    window.dispatchEvent(new CustomEvent('auth:login', { detail: { user: data.user } }));
    return data;
}

/** Регистрация + автологин */
export async function register(username, email, password) {
    await api.post('/auth/register', { username, email, password });
    return await login(username, password);
}

export function me() { return getUser(); }

export function signout() {
    logout();
    window.dispatchEvent(new CustomEvent('auth:logout'));
}

/** Тихий запуск */
export async function boot() {
    await restoreSession();
}

// удобные подписчики (опционально)
export function onAuthLogin(handler) {
    window.addEventListener('auth:login', (e) => handler?.(e.detail?.user));
}
export function onAuthLogout(handler) {
    window.addEventListener('auth:logout', () => handler?.());
}
