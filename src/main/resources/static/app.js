(() => {
  const auth = {
    accessToken: null,
    refreshToken: null,
    user: null,
    roles: [],
    setTokens({ accessToken, refreshToken }) {
      if (accessToken) auth.accessToken = accessToken;
      if (refreshToken) auth.refreshToken = refreshToken;
      if (accessToken) {
        const payload = decodeJwt(accessToken);
        auth.user = payload && (payload.username || payload.sub || payload.userId)
          ? { id: payload.userId || payload.id, username: payload.username || payload.sub, email: payload.email }
          : null;
        const raw = Array.isArray(payload && payload.roles) ? payload.roles : (payload && typeof payload.role === 'string' ? [payload.role] : []);
        auth.roles = normalizeRoles(raw);
      }
    },
    clear() { auth.accessToken = null; auth.refreshToken = null; auth.user = null; auth.roles = []; }
  };

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function base64UrlDecode(input) {
    try {
      const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
      const decoded = atob(padded);
      const bytes = new Uint8Array([...decoded].map(c => c.charCodeAt(0)));
      const text = new TextDecoder().decode(bytes);
      return text;
    } catch { return null; }
  }

  function decodeJwt(token) {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const json = base64UrlDecode(parts[1]);
    try { return JSON.parse(json); } catch { return null; }
  }

  function normalizeRoles(list) {
    if (!Array.isArray(list)) return [];
    const out = new Set();
    for (const r of list) {
      if (!r) continue;
      const up = String(r).toUpperCase();
      // strip any prefix before last underscore: ROLE_ADMIN, РОЛЬ_ADMIN, etc.
      const simple = up.includes('_') ? up.substring(up.lastIndexOf('_') + 1) : up;
      out.add(simple);
      // also keep GM/GAME_MASTER synonyms
      if (simple === 'GM') out.add('GAME_MASTER');
      if (simple === 'GAME' || simple === 'GAME-MASTER' || simple === 'GAME MASTER' || simple === 'GAME_MASTER') {
        out.add('GM'); out.add('GAME_MASTER');
      }
    }
    return Array.from(out);
  }

  function setMessage(el, text, type = "") {
    if (!el) return;
    el.textContent = text || "";
    el.classList.remove("ok", "err");
    if (type) el.classList.add(type);
  }

  async function api(path, options = {}, retry = true) {
    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
    if (auth.accessToken) headers.set("Authorization", `Bearer ${auth.accessToken}`);
    const res = await fetch(path, { ...options, headers, credentials: 'include' });
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json().catch(() => ({})) : await res.text();
    if (res.status === 401 && retry) {
      const refreshed = await tryRefresh();
      if (refreshed) return api(path, options, false);
    }
    if (!res.ok) {
      const msg = (data && data.message) || (typeof data === "string" ? data : res.statusText);
      const error = new Error(msg || `HTTP ${res.status}`);
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  async function tryRefresh() {
    try {
      const payload = auth.refreshToken ? { refreshToken: auth.refreshToken } : undefined;
      const res = await fetch('/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: payload ? { 'Content-Type': 'application/json' } : undefined,
        body: payload ? JSON.stringify(payload) : undefined
      });
      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const data = isJson ? await res.json().catch(() => ({})) : await res.text();
      if (!res.ok) return false;
      if (data && (data.accessToken || data.refreshToken)) auth.setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      return !!(data && data.accessToken);
    } catch { return false; }
  }

  function bindLogin() {
    const form = qs('#login-form');
    const msg = qs('#login-message');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      setMessage(msg, "", "");
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      try {
        const payload = {
          usernameOrEmail: qs('#login-username').value.trim(),
          password: qs('#login-password').value
        };
        if (!payload.usernameOrEmail || !payload.password) {
          setMessage(msg, 'Please enter username and password', 'err');
          return;
        }
        const res = await api('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
        // Expecting { accessToken, refreshToken?, user? }
        if (res && (res.accessToken || res.refreshToken)) {
          auth.setTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
          setMessage(msg, 'Signed in successfully.', 'ok');
          onAuthenticated();
        } else {
          setMessage(msg, 'Unexpected response from server', 'err');
        }
      } catch (err) {
        setMessage(msg, err.message || 'Login failed', 'err');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  function bindRegister() {
    const form = qs('#register-form');
    const msg = qs('#register-message');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      setMessage(msg, "", "");
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      try {
        const payload = {
          username: qs('#reg-username').value.trim(),
          email: qs('#reg-email').value.trim(),
          rawPassword: qs('#reg-password').value
        };
        if (!payload.username || !payload.email || !payload.rawPassword) {
          setMessage(msg, 'Please fill all fields', 'err');
          return;
        }
        const res = await api('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
        if (res) {
          setMessage(msg, 'Account created. You can sign in now.', 'ok');
          qs('#login-username').value = payload.username;
        }
      } catch (err) {
        setMessage(msg, err.message || 'Registration failed', 'err');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  function updateLoggedInUI() {
    const welcome = qs('#welcome-view');
    const dash = qs('#dashboard-view');
    const name = qs('#user-name');
    const rolesEl = qs('#user-roles');
    if (!dash || !welcome) return;
    if (auth.accessToken) {
      welcome.hidden = true;
      dash.hidden = false;
      name.textContent = (auth.user && auth.user.username) || 'User';
      rolesEl.textContent = auth.roles.join(', ') || 'PLAYER';
      // Toggle nav links by roles
      const has = r => auth.roles.includes(r);
      qs('#link-items').hidden = !has('ADMIN');
      qs('#link-campaigns').hidden = false; // everyone can see campaigns they participate in
      qs('#link-characters').hidden = false; // everyone can see their characters
      qs('#link-journal').hidden = false;
    } else {
      dash.hidden = true;
      welcome.hidden = false;
    }
  }

  function bindLogout() {
    const btn = qs('#btn-logout');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      auth.clear();
      location.hash = '';
      updateLoggedInUI();
      setRouteContent('Signed out.');
    });
  }

  function setRouteContent(html) {
    const outlet = qs('#route-outlet');
    if (outlet) outlet.innerHTML = html;
  }

  function renderList(items, emptyText, mapper) {
    if (!Array.isArray(items) || items.length === 0) {
      return `<p class="muted">${emptyText}</p>`;
    }
    const rows = items.map(mapper).join('');
    return `<ul class="list">${rows}</ul>`;
  }

  async function showCharacters() {
    const userId = auth.user && auth.user.id;
    if (!userId) { setRouteContent('<p>Cannot determine current user.</p>'); return; }
    setRouteContent('<h2>Characters</h2><p class="muted">Loading…</p>');
    try {
      const data = await api(`/api/characters/by-owner-id/${encodeURIComponent(userId)}`);
      const html = `
        <h2>Characters</h2>
        ${renderList(data, 'You have no characters yet.', (c) => (
          `<li class="list-item"><div class="list-title">${escapeHtml(c.name || 'Unnamed')}</div>
            <div class="list-sub">HP: ${c.hp ?? '-'} • Campaign: ${c.campaignName || c.campaignId || '-'}</div>
          </li>`
        ))}
      `;
      setRouteContent(html);
    } catch (e) {
      setRouteContent(`<h2>Characters</h2><p class="err">${escapeHtml(e.message || 'Failed to load')}</p>`);
    }
  }

  async function showCampaigns() {
    setRouteContent('<h2>Campaigns</h2><p class="muted">Loading…</p>');
    try {
      const data = await api('/api/campaigns/participating');
      const html = `
        <h2>Campaigns</h2>
        ${renderList(data, 'You are not a member of any campaigns yet.', (c) => (
          `<li class="list-item"><div class="list-title">${escapeHtml(c.name || 'Unnamed')}</div>
            <div class="list-sub">GM: ${c.gmId || '-'} • Created: ${c.createdAt || '-'}</div>
          </li>`
        ))}
      `;
      setRouteContent(html);
    } catch (e) {
      setRouteContent(`<h2>Campaigns</h2><p class="err">${escapeHtml(e.message || 'Failed to load')}</p>`);
    }
  }

  async function showItems() {
    const searchBox = `
      <div class="toolbar"><input id="item-q" placeholder="Search items by name…" /><button class="btn" id="item-search">Search</button></div>
      <div id="item-results"><p class="muted">Enter a query and press Search.</p></div>
    `;
    setRouteContent(`<h2>Items (Admin)</h2>${searchBox}`);

    async function runSearch() {
      const q = (qs('#item-q').value || '').trim();
      if (!q) { qs('#item-results').innerHTML = '<p class="muted">Type something to search.</p>'; return; }
      qs('#item-results').innerHTML = '<p class="muted">Searching…</p>';
      try {
        const data = await api(`/api/items?query=${encodeURIComponent(q)}`);
        const html = renderList(data, 'No items found.', (it) => (
          `<li class="list-item"><div class="list-title">${escapeHtml(it.name || 'Unnamed')}</div>
            <div class="list-sub">${escapeHtml(it.description || '')}</div>
          </li>`
        ));
        qs('#item-results').innerHTML = html;
      } catch (e) {
        qs('#item-results').innerHTML = `<p class="err">${escapeHtml(e.message || 'Search failed')}</p>`;
      }
    }

    qs('#item-search').addEventListener('click', runSearch);
    qs('#item-q').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') runSearch(); });
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function router() {
    const route = location.hash.slice(1) || '/';
    if (!auth.accessToken) {
      updateLoggedInUI();
      return;
    }
    switch (route) {
      case '/items':
        showItems();
        break;
      case '/campaigns':
        showCampaigns();
        break;
      case '/characters':
        showCharacters();
        break;
      case '/journal':
        setRouteContent('<h2>Journal</h2><p>Campaign journal will appear here.</p>');
        break;
      default:
        setRouteContent('<p>Select a section from the navigation.</p>');
    }
    updateLoggedInUI();
  }

  function onAuthenticated() {
    updateLoggedInUI();
    // Choose default landing based on roles
    const has = r => auth.roles.includes(r);
    if (has('ADMIN')) location.hash = '#/items';
    else if (has('GAME_MASTER') || has('GM')) location.hash = '#/campaigns';
    else location.hash = '#/characters';
    router();
  }

  function init() {
    bindLogin();
    bindRegister();
    bindLogout();
    window.addEventListener('hashchange', router);
    updateLoggedInUI();
  }

  document.addEventListener('DOMContentLoaded', init);
})();


