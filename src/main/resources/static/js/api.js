// js/api.js — минимальный helper с авто-добавлением Authorization и refresh

const DEFAULT_BASE = ''; // same-origin (http://localhost:8080)
const KEY_REFRESH = 'refreshToken';
const KEY_USER = 'user';

let accessToken = null;
let refreshToken = null;
let currentUser = null;

export function setApiUrl(url) {
    localStorage.setItem('apiUrl', url);
}
export function getApiUrl() {
    return localStorage.getItem('apiUrl') || DEFAULT_BASE;
}

export function setAuth({ access, refresh, user }) {
    accessToken = access || null;
    refreshToken = refresh || null;
    currentUser = user || null;

    if (refreshToken) localStorage.setItem(KEY_REFRESH, refreshToken);
    else localStorage.removeItem(KEY_REFRESH);

    if (user) localStorage.setItem(KEY_USER, JSON.stringify(user));
    else localStorage.removeItem(KEY_USER);
}

export function getUser() {
    if (currentUser) return currentUser;
    const raw = localStorage.getItem(KEY_USER);
    return raw ? JSON.parse(raw) : null;
}

export function logout() {
    accessToken = null;
    refreshToken = null;
    currentUser = null;
    localStorage.removeItem(KEY_REFRESH);
    localStorage.removeItem(KEY_USER);
}

export async function restoreSession() {
    accessToken = null;
    refreshToken = localStorage.getItem(KEY_REFRESH);
    const raw = localStorage.getItem(KEY_USER);
    currentUser = raw ? JSON.parse(raw) : null;
    if (!refreshToken) return null;
    try {
        const res = await fetch(getApiUrl() + '/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });
        if (!res.ok) throw new Error('refresh failed');
        const data = await res.json();
        accessToken = data.accessToken;
        refreshToken = data.refreshToken || refreshToken;
        if (data.user) {
            currentUser = data.user;
            localStorage.setItem(KEY_USER, JSON.stringify(data.user));
        }
        return accessToken;
    } catch {
        logout();
        return null;
    }
}

// --- базовый fetch c повтором после 401 ---
async function doFetch(path, opts = {}, retry = true) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    if (accessToken) headers['Authorization'] = 'Bearer ' + accessToken;

    const res = await fetch(getApiUrl() + path, { ...opts, headers });

    if (res.status === 401 && retry && localStorage.getItem(KEY_REFRESH)) {
        const ok = await restoreSession();
        if (ok) return doFetch(path, opts, false);
    }
    return res;
}

// --- удобные методы ---
export const api = {
    get: (p) => doFetch(p, { method: 'GET' }),
    post: (p, body) => doFetch(p, { method: 'POST', body: JSON.stringify(body) }),
    put: (p, body) => doFetch(p, { method: 'PUT', body: JSON.stringify(body) }),
    patch: (p, body) => doFetch(p, { method: 'PATCH', body: JSON.stringify(body) }),
    del: (p) => doFetch(p, { method: 'DELETE' }),
};

// --- хелпер: нормализация ошибок ответа ---
export async function readError(res) {
    try {
        const data = await res.json();
        if (data?.message) return data.message;
        if (data?.error) return data.error;
        return JSON.stringify(data);
    } catch {
        try {
            const txt = await res.text();
            return txt || res.statusText || 'Ошибка запроса';
        } catch {
            return 'Ошибка запроса';
        }
    }
}
