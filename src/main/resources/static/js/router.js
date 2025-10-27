// router.js — tiny hash router with dynamic params + guard

const routes = [];
let notFound = null;
let beforeEachGuard = null;

export function route(pattern, handler, opts = {}) {
    const { regex, keys } = compile(pattern);
    routes.push({ pattern, regex, keys, handler, opts });
}
export function setNotFound(handler) { notFound = handler; }
export function setBeforeEach(guardFn) { beforeEachGuard = guardFn; }

export function navigate(patternOrPath, params = null, query = null) {
    const path = buildPath(patternOrPath, params, query);
    const hash = path.startsWith('#') ? path : '#' + path;
    if (location.hash !== hash) location.hash = hash; else dispatch();
}

export function dispatch() {
    const full = (location.hash || '').replace(/^#/, '') || '/';
    const [pathname, qs] = full.split('?');
    const query = Object.fromEntries(new URLSearchParams(qs || ''));

    let match = null;
    for (const r of routes) {
        const m = r.regex.exec(pathname);
        if (m) { match = { r, m }; break; }
    }

    const ctx = {
        path: pathname,
        params: match ? extractParams(match.r.keys, match.m) : {},
        query,
        hash: full
    };

    if (beforeEachGuard) {
        const ok = beforeEachGuard(ctx);
        if (ok === false) return;
    }

    if (match) match.r.handler?.(ctx);
    else notFound?.(ctx);
}

export function link(el, patternOrPath, params = null, query = null) {
    el?.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(patternOrPath, params, query);
    });
}

window.addEventListener('hashchange', dispatch);

// helpers
function compile(pattern) {
    if (!pattern.includes(':')) {
        const safe = pattern.endsWith('/') && pattern !== '/' ? pattern.slice(0, -1) : pattern;
        return { regex: new RegExp('^' + escapeRe(safe) + '$'), keys: [] };
    }
    const keys = [];
    const rx = pattern
        .split('/')
        .map(seg => {
            if (seg.startsWith(':')) { keys.push(seg.slice(1)); return '([^/]+)'; }
            return escapeRe(seg);
        })
        .join('/');
    return { regex: new RegExp('^' + rx + '$'), keys };
}
function extractParams(keys, match) {
    const out = {};
    for (let i=0;i<keys.length;i++) out[keys[i]] = decodeURIComponent(match[i+1]);
    return out;
}
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function buildPath(patternOrPath, params, query) {
    let path = patternOrPath;
    if (params && /:([A-Za-z0-9_]+)/.test(path)) {
        path = path.replace(/:([A-Za-z0-9_]+)/g, (_, k) => encodeURIComponent(params[k] ?? ''));
    }
    if (path.startsWith('#')) path = path.slice(1);
    if (query && Object.keys(query).length) {
        const qs = new URLSearchParams();
        for (const [k,v] of Object.entries(query)) {
            if (v === undefined || v === null || v === '') continue;
            qs.set(k, String(v));
        }
        const str = qs.toString();
        if (str) path += (path.includes('?') ? '&' : '?') + str;
    }
    return path || '/';
}

export function current() {
    const full = (location.hash || '').replace(/^#/, '') || '/';
    const [pathname, qs] = full.split('?');
    return { path: pathname, query: Object.fromEntries(new URLSearchParams(qs || '')) };
}
