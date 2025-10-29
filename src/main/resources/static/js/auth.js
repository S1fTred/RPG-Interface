// js/auth.js — логин/регистрация + авто-профиль из JWT + фолбэк на /me
import { api, setAuth, getUser, logout, restoreSession, getApiUrl, readError, setUser } from './api.js';

/* --- минимальный decoder для JWT payload (Base64url → JSON) --- */
function decodeJwtPayload(token) {
    if (!token || token.split('.').length < 2) return null;
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    try {
        const json = atob(b64);
        return JSON.parse(decodeURIComponent(Array.prototype.map.call(json, c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join('')));
    } catch {
        try { return JSON.parse(atob(b64)); } catch { return null; }
    }
}

/* --- соберём user из клеймов, если они есть --- */
function buildUserFromClaims(claims) {
    if (!claims) return null;
    // Возможные варианты: userId (UUID), sub (UUID/username/email), preferred_username, username
    const id = claims.userId || claims.uid || claims.id || null;
    const username = claims.username || claims.preferred_username || claims.sub || null;
    // roles могут жить в "roles", "authorities", "scope"
    let roles = claims.roles || claims.authorities || [];
    if (typeof roles === 'string') {
        roles = roles.split(/\s|,/).filter(Boolean);
    }
    return (id || username) ? { id, username, email: claims.email || null, roles } : null;
}

/* --- пробуем получить профиль с бэка --- */
async function fetchUserProfile() {
    const candidates = ['/auth/me', '/api/me', '/api/users/me', '/users/me'];
    for (const p of candidates) {
        try {
            const data = await api.get(p);
            if (data && (data.id || data.username || data.email)) return data;
        } catch { /* next */ }
    }
    return null;
}

/* --- после получения токенов обязательно пытаемся заполнить user --- */
async function ensureUserPresent(accessToken) {
    // 1) из JWT
    const claims = decodeJwtPayload(accessToken);
    const fromJwt = buildUserFromClaims(claims);
    if (fromJwt) { setUser(fromJwt); return fromJwt; }

    // 2) с бэка по стандартным эндпоинтам
    const profile = await fetchUserProfile();
    if (profile) { setUser(profile); return profile; }

    return null;
}

/* --- Универсальный логин: пробуем разные DTO, затем достаём user --- */
export async function login(usernameOrEmail, password) {
    const url = getApiUrl() + '/auth/login';
    const headers = { 'Content-Type': 'application/json' };

    const bodies = [
        { username: usernameOrEmail, password },
        { email: usernameOrEmail, password },
        { usernameOrEmail, password },
        { login: usernameOrEmail, password },
    ];

    let lastErr = null;
    for (const body of bodies) {
        try {
            const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
            if (!res.ok) { lastErr = new Error(await readError(res)); continue; }
            const data = await res.json();

            setAuth({ access: data.accessToken, refresh: data.refreshToken, user: data.user || null });
            // ВАЖНО: если user не пришёл — достанем из JWT и/или /auth/me
            await ensureUserPresent(data.accessToken);

            window.dispatchEvent(new CustomEvent('auth:login', { detail: { user: getUser() } }));
            return { ...data, user: getUser() };
        } catch (e) {
            lastErr = e;
        }
    }
    throw (lastErr || new Error('Не удалось выполнить вход'));
}

/* --- Регистрация + автологин --- */
export async function register(username, email, password) {
    const url = getApiUrl() + '/auth/register';
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });
    if (!res.ok) throw new Error(await readError(res));
    return await login(username, password);
}

export function me() { return getUser(); }

export function signout() {
    logout();
    window.dispatchEvent(new CustomEvent('auth:logout'));
}

/* --- boot: refresh + добрать user (JWT или /me), если он не сохранён --- */
export async function boot() {
    await restoreSession();
    if (!getUser()) {
        // попробуем вытащить профиль через /me — doFetch уже подставит токен
        const profile = await fetchUserProfile();
        if (profile) setUser(profile);
    }
}

// подписчики (опционально)
export function onAuthLogin(handler) {
    window.addEventListener('auth:login', (e) => handler?.(e.detail?.user));
}
export function onAuthLogout(handler) {
    window.addEventListener('auth:logout', () => handler?.());
}
