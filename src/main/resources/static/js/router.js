// router.js — tiny hash router with dynamic params + guard

// Internal route table: [{ pattern, regex, keys, handler, opts }]
const routes = [];
let notFound = null;
let beforeEachGuard = null;

// ===== public API =====

/**
 * Define a route
 * @param {string} pattern e.g. '/', '/campaigns', '/campaigns/:id'
 * @param {(ctx:{path:string, params:object, query:object, hash:string})=>void} handler
 * @param {{meta?:any}} opts
 */
export function route(pattern, handler, opts = {}) {
    const { regex, keys } = compile(pattern);
    routes.push({ pattern, regex, keys, handler, opts });
}

/** Set 404 handler */
export function setNotFound(handler) { notFound = handler; }

/** Set a global guard called before each navigation. Return false to cancel. */
export function setBeforeEach(guardFn) { beforeEachGuard = guardFn; }

/**
 * Navigate to path. Examples:
 *  navigate('/campaigns');
 *  navigate('/campaigns/:id', {id: 42});
 *  navigate('/journals', null, {campaignId: 7, include: 'all'});
 */
export function navigate(patternOrPath, params = null, query = null) {
    const path = buildPath(patternOrPath, params, query);
    const hash = path.startsWith('#') ? path : '#' + path;
    if (location.hash !== hash) location.hash = hash; else dispatch(); // same-hash re-dispatch
}

/** Force re-dispatch current hash */
export function dispatch() {
    const full = (location.hash || '').replace(/^#/, '') || '/';
    const [pathname, qs] = full.split('?');
    const query = Object.fromEntries(new URLSearchParams(qs || ''));

    // Find first matching route (dynamic segments supported)
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

    // Guard
    if (beforeEachGuard) {
        const ok = beforeEachGuard(ctx);
        if (ok === false) return;
    }

    if (match) match.r.handler?.(ctx);
    else notFound?.(ctx);
}

/**
 * Bind a link/button to navigate
 * @param {Element} el
 * @param {string} patternOrPath
 * @param {object?} params
 * @param {object?} query
 */
export function link(el, patternOrPath, params = null, query = null) {
    el?.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(patternOrPath, params, query);
    });
}

// Re-dispatch on hash change
window.addEventListener('hashchange', dispatch);

// ===== helpers =====

function compile(pattern) {
    // Exact path (no dynamic segments)
    if (!pattern.includes(':')) {
        const safe = pattern.endsWith('/') && pattern !== '/' ? pattern.slice(0, -1) : pattern;
        return { regex: new RegExp('^' + escapeRe(safe) + '$'), keys: [] };
    }
    const keys = [];
    const rx = pattern
        .split('/')
        .map(seg => {
            if (seg.startsWith(':')) {
                const key = seg.slice(1);
                keys.push(key);
                return '([^/]+)';
            }
            return escapeRe(seg);
        })
        .join('/');
    return { regex: new RegExp('^' + rx + '$'), keys };
}

function extractParams(keys, match) {
    const out = {};
    for (let i = 0; i < keys.length; i++) out[keys[i]] = decodeURIComponent(match[i + 1]);
    return out;
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function buildPath(patternOrPath, params, query) {
    let path = patternOrPath;
    // If pattern contains :params → substitute
    if (params && /:([A-Za-z0-9_]+)/.test(path)) {
        path = path.replace(/:([A-Za-z0-9_]+)/g, (_, k) => encodeURIComponent(params[k] ?? ''));
    }
    // If user passed an absolute hash, normalize
    if (path.startsWith('#')) path = path.slice(1);
    // Append query
    if (query && Object.keys(query).length) {
        const qs = new URLSearchParams();
        for (const [k, v] of Object.entries(query)) {
            if (v === undefined || v === null || v === '') continue;
            qs.set(k, String(v));
        }
        const str = qs.toString();
        if (str) path += (path.includes('?') ? '&' : '?') + str;
    }
    return path || '/';
}

// Optional: expose current route parse (handy if needed elsewhere)
export function current() {
    const full = (location.hash || '').replace(/^#/, '') || '/';
    const [pathname, qs] = full.split('?');
    return { path: pathname, query: Object.fromEntries(new URLSearchParams(qs || '')) };
}

// Auto-dispatch on first load if there is a hash; otherwise consumer can call dispatch() when ready.
