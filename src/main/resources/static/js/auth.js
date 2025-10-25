// js/auth.js — логин/регистрация с событиями и нормальными ошибками

import { api, setAuth, getUser, logout, restoreSession, readError } from './api.js';

export async function login(username, password) {
    const res = await api.post('/auth/login', { username, password });
    if (!res.ok) {
        throw new Error(await readError(res));
    }
    const data = await res.json();
    setAuth({ access: data.accessToken, refresh: data.refreshToken, user: data.user });

    // событие успешной аутентификации
    window.dispatchEvent(new CustomEvent('auth:login', { detail: { user: data.user } }));
    return data;
}

export async function register(username, email, password) {
    const res = await api.post('/auth/register', { username, email, password });
    if (!res.ok) {
        throw new Error(await readError(res));
    }
    // после успешной регистрации — сразу логиним
    return await login(username, password);
}

export function me() { return getUser(); }

export function signout() {
    logout();
    window.dispatchEvent(new CustomEvent('auth:logout'));
}

export async function boot() {
    await restoreSession();
}
