// js/api.js — helper с авто Authorization, auto-refresh и авто JSON-парсинг

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

// --- базовый fetch с повтором после 401 ---
async function doFetch(path, opts = {}, retry = true) {
    const headers = Object.assign({}, opts.headers || {});
    // Проставляем JSON Content-Type только когда есть тело и это не FormData
    const hasBody = opts.body !== undefined && opts.body !== null;
    const isForm = typeof FormData !== 'undefined' && (hasBody && opts.body instanceof FormData);
    if (hasBody && !isForm && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }
    if (accessToken) headers['Authorization'] = 'Bearer ' + accessToken;

    const res = await fetch(getApiUrl() + path, { ...opts, headers });

    if (res.status === 401 && retry && localStorage.getItem(KEY_REFRESH)) {
        const ok = await restoreSession();
        if (ok) return doFetch(path, opts, false);
    }
    return res;
}

// --- хелпер: нормализация ошибок ответа ---
export async function readError(res) {
    try {
        const ct = res.headers.get('Content-Type') || '';
        if (ct.includes('application/json')) {
            const data = await res.json();
            if (data?.message) return data.message;
            if (data?.error) return data.error;
            return JSON.stringify(data);
        }
        const txt = await res.text();
        return txt || res.statusText || 'Ошибка запроса';
    } catch {
        return 'Ошибка запроса';
    }
}

// --- авто JSON парсер, выбрасывает строку-ошибку при !ok ---
async function parseOrThrow(res) {
    if (res.ok) {
        if (res.status === 204) return null;
        const ct = res.headers.get('Content-Type') || '';
        if (ct.includes('application/json')) {
            return await res.json();
        }
        // если не json, вернём текст (на всякий случай)
        return await res.text();
    } else {
        const msg = await readError(res);
        throw new Error(msg);
    }
}

// --- удобные методы, возвращают уже данные (JSON/текст) ---
export const api = {
    get: async (p) => parseOrThrow(await doFetch(p, { method: 'GET' })),
    post: async (p, body) => parseOrThrow(await doFetch(p, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) })),
    put: async (p, body) => parseOrThrow(await doFetch(p, { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) })),
    patch: async (p, body) => parseOrThrow(await doFetch(p, { method: 'PATCH', body: body instanceof FormData ? body : JSON.stringify(body) })),
    del: async (p) => parseOrThrow(await doFetch(p, { method: 'DELETE' })),
};
