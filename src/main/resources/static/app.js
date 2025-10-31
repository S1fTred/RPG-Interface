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

    const layout = `
      <h2>Characters</h2>
      <div class="panel" id="char-create">
        <h3>Create character</h3>
        <div class="grid-2">
          <input id="ch-name" placeholder="Name" />
          <select id="ch-campaign"><option value="">Campaign…</option></select>
        </div>
        <div class="grid-2">
          <input id="ch-class" placeholder="Class" />
          <input id="ch-race" placeholder="Race" />
        </div>
        <div class="grid-2">
          <input id="ch-level" placeholder="Level (1-20)" />
          <input id="ch-maxhp" placeholder="Max HP (1-999)" />
        </div>
        <div class="grid-2">
          <input id="ch-hp" placeholder="HP (0..max)" />
          <span></span>
        </div>
        <div class="grid-2">
          <input id="ch-str" placeholder="STRENGTH" />
          <input id="ch-dex" placeholder="DEXTERITY" />
        </div>
        <div class="grid-2">
          <input id="ch-con" placeholder="CONSTITUTION" />
          <input id="ch-int" placeholder="INTELLIGENCE" />
        </div>
        <div class="grid-2">
          <input id="ch-wis" placeholder="WISDOM" />
          <input id="ch-cha" placeholder="CHARISMA" />
        </div>
        <button type="button" class="btn primary" id="btn-ch-create">Create</button>
        <div class="form-message" id="ch-create-msg"></div>
      </div>
      <div class="panel" id="char-list">
        <div id="char-results"><p class="muted">Loading…</p></div>
      </div>
    `;
    setRouteContent(layout);

    async function loadCampaigns() {
      try {
        const campaigns = await api('/api/campaigns/participating');
        const sel = qs('#ch-campaign');
        sel.innerHTML = '<option value="">Campaign…</option>' + (campaigns || []).map(c => `<option value="${c.id}">${escapeHtml(c.name || c.id)}</option>`).join('');
      } catch {}
    }

    function toInt(v, def = null) { const n = Number(v); return Number.isFinite(n) ? n : def; }

    async function createCharacter() {
      const msg = qs('#ch-create-msg'); setMessage(msg, '', '');
      const payload = {
        name: (qs('#ch-name').value || '').trim(),
        clazz: (qs('#ch-class').value || '').trim(),
        race: (qs('#ch-race').value || '').trim(),
        level: toInt(qs('#ch-level').value, 1) || 1,
        hp: toInt(qs('#ch-hp').value, 0) || 0,
        maxHp: toInt(qs('#ch-maxhp').value, 1) || 1,
        attributes: {
          strength: toInt(qs('#ch-str').value, 10) || 10,
          dexterity: toInt(qs('#ch-dex').value, 10) || 10,
          constitution: toInt(qs('#ch-con').value, 10) || 10,
          intelligence: toInt(qs('#ch-int').value, 10) || 10,
          wisdom: toInt(qs('#ch-wis').value, 10) || 10,
          charisma: toInt(qs('#ch-cha').value, 10) || 10
        }
      };
      const campaignId = qs('#ch-campaign').value;
      if (!payload.name || !payload.clazz || !payload.race || !campaignId) {
        setMessage(msg, 'Name, Class, Race and Campaign are required', 'err'); return;
      }
      try {
        await api(`/api/characters/crt/${encodeURIComponent(campaignId)}`, { method: 'POST', body: JSON.stringify(payload) });
        setMessage(msg, 'Character created', 'ok');
        await runList();
      } catch (e) {
        setMessage(msg, e.message || 'Create failed', 'err');
      }
    }

    function renderCharItem(c) {
      return `
        <li class="list-item" data-id="${c.id}">
          <div class="row-between">
            <div>
              <div class="list-title">${escapeHtml(c.name || 'Unnamed')} <span class="list-sub">[${escapeHtml(c.race||'')}/${escapeHtml(c.clazz||'')}]</span></div>
              <div class="list-sub">Level: ${c.level} • HP: ${c.hp}/${c.maxHp} • Campaign: ${c.campaignId || '-'}</div>
              <div class="list-sub">STR ${c.attributes?.strength ?? '-'} | DEX ${c.attributes?.dexterity ?? '-'} | CON ${c.attributes?.constitution ?? '-'} | INT ${c.attributes?.intelligence ?? '-'} | WIS ${c.attributes?.wisdom ?? '-'} | CHA ${c.attributes?.charisma ?? '-'}</div>
            </div>
            <div class="actions">
              <button type="button" class="btn" data-act="hp">Set HP</button>
              <button type="button" class="btn" data-act="edit">Edit</button>
              <button type="button" class="btn" data-act="delete">Delete</button>
            </div>
          </div>
        </li>`;
    }

    async function runList() {
      try {
        const data = await api(`/api/characters/by-owner-id/${encodeURIComponent(userId)}`);
        qs('#char-results').innerHTML = renderList(data, 'You have no characters yet.', renderCharItem);
      } catch (e) {
        qs('#char-results').innerHTML = `<p class="err">${escapeHtml(e.message || 'Failed to load')}</p>`;
      }
    }

    function openEdit(li) {
      const id = li.getAttribute('data-id');
      const title = li.querySelector('.list-title')?.childNodes[0]?.textContent?.trim() || '';
      const meta = li.querySelectorAll('.list-sub')[0]?.textContent || '';
      const attr = li.querySelectorAll('.list-sub')[1]?.textContent || '';
      const raceClass = /\[(.*?)\/(.*?)\]/.exec(li.querySelector('.list-title')?.textContent || '');
      const race = raceClass ? raceClass[1].trim() : '';
      const clazz = raceClass ? raceClass[2].trim() : '';
      const levelMatch = /Level:\s(\d+)/.exec(meta);
      const maxHpMatch = /\/(\d+)/.exec(meta);
      const level = levelMatch ? levelMatch[1] : '';
      const maxHp = maxHpMatch ? maxHpMatch[1] : '';
      const nums = (k) => { const m = new RegExp(`${k}\\s(\\d+)`).exec(attr); return m ? m[1] : ''; };
      li.innerHTML = `
        <div class="edit-grid">
          <input class="ed-name" value="${escapeHtml(title)}" />
          <input class="ed-class" value="${escapeHtml(clazz)}" placeholder="Class" />
          <input class="ed-race" value="${escapeHtml(race)}" placeholder="Race" />
          <input class="ed-level" value="${escapeHtml(level)}" placeholder="Level" />
          <input class="ed-maxhp" value="${escapeHtml(maxHp)}" placeholder="Max HP" />
          <input class="ed-str" value="${escapeHtml(nums('STR'))}" placeholder="STR" />
          <input class="ed-dex" value="${escapeHtml(nums('DEX'))}" placeholder="DEX" />
          <input class="ed-con" value="${escapeHtml(nums('CON'))}" placeholder="CON" />
          <input class="ed-int" value="${escapeHtml(nums('INT'))}" placeholder="INT" />
          <input class="ed-wis" value="${escapeHtml(nums('WIS'))}" placeholder="WIS" />
          <input class="ed-cha" value="${escapeHtml(nums('CHA'))}" placeholder="CHA" />
          <div class="actions">
            <button type="button" class="btn" data-act="save">Save</button>
            <button type="button" class="btn" data-act="cancel">Cancel</button>
          </div>
        </div>`;
    }

    async function saveEdit(li) {
      const id = li.getAttribute('data-id');
      const body = {
        name: (li.querySelector('.ed-name').value || '').trim() || null,
        clazz: (li.querySelector('.ed-class').value || '').trim() || null,
        race: (li.querySelector('.ed-race').value || '').trim() || null,
        level: toInt(li.querySelector('.ed-level').value, null),
        maxHp: toInt(li.querySelector('.ed-maxhp').value, null),
        attributes: {
          strength: toInt(li.querySelector('.ed-str').value, null) ?? 10,
          dexterity: toInt(li.querySelector('.ed-dex').value, null) ?? 10,
          constitution: toInt(li.querySelector('.ed-con').value, null) ?? 10,
          intelligence: toInt(li.querySelector('.ed-int').value, null) ?? 10,
          wisdom: toInt(li.querySelector('.ed-wis').value, null) ?? 10,
          charisma: toInt(li.querySelector('.ed-cha').value, null) ?? 10,
        }
      };
      try {
        await api(`/api/characters/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) });
        await runList();
      } catch (e) {
        alert(e.message || 'Update failed');
      }
    }

    async function setHp(id) {
      const val = prompt('Set HP to:');
      if (val == null) return;
      const hp = Number(val);
      if (!Number.isFinite(hp)) { alert('Invalid HP'); return; }
      try {
        await api(`/api/characters/${encodeURIComponent(id)}/hp?hp=${encodeURIComponent(hp)}`, { method: 'PATCH' });
        await runList();
      } catch (e) { alert(e.message || 'Failed to set HP'); }
    }

    async function removeChar(id, li) {
      if (!confirm('Delete this character?')) return;
      try {
        await api(`/api/characters/${encodeURIComponent(id)}`, { method: 'DELETE' });
        li.remove();
      } catch (e) { alert(e.message || 'Delete failed'); }
    }

    function bindCharActions() {
      const container = qs('#char-results');
      container.addEventListener('click', async (ev) => {
        const btn = ev.target.closest('button[data-act]'); if (!btn) return;
        ev.preventDefault(); ev.stopPropagation();
        const li = ev.target.closest('li.list-item');
        if (!li) return;
        const id = li.getAttribute('data-id');
        const act = btn.getAttribute('data-act');
        if (act === 'edit') openEdit(li);
        if (act === 'save') await saveEdit(li);
        if (act === 'cancel') await runList();
        if (act === 'hp') await setHp(id);
        if (act === 'delete') await removeChar(id, li);
      });
    }

    await loadCampaigns();
    await runList();
    bindCharActions();
    qs('#btn-ch-create').addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); createCharacter(); });
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
    const html = `
      <h2>Items (Admin)</h2>
      <div class="panel" id="item-create">
        <h3>Create item</h3>
        <div class="grid-2">
          <input id="new-name" placeholder="Title" />
          <input id="new-price" placeholder="Price" />
        </div>
        <div class="grid-2">
          <input id="new-weight" placeholder="Weight" />
          <input id="new-desc" placeholder="Description" />
        </div>
        <button type="button" class="btn primary" id="btn-create-item">Create</button>
        <div class="form-message" id="create-msg"></div>
      </div>

      <div class="panel" id="item-search-panel">
        <div class="toolbar">
          <input id="item-q" placeholder="Search items by name…" />
          <button type="button" class="btn" id="item-search">Search</button>
          <button type="button" class="btn" id="item-all">Show all</button>
        </div>
        <div id="item-results"><p class="muted">Enter a query and press Search.</p></div>
      </div>
    `;
    setRouteContent(html);

    async function runSearch() {
      const q = (qs('#item-q').value || '').trim();
      if (!q) { return runAll(); }
      qs('#item-results').innerHTML = '<p class="muted">Searching…</p>';
      try {
        const data = await api(`/api/items?query=${encodeURIComponent(q)}`);
        const list = renderList(data, 'No items found.', (it) => (
          `<li class="list-item" data-id="${it.id}">
            <div class="row-between">
              <div>
                <div class="list-title">${escapeHtml(it.name || 'Unnamed')}</div>
                <div class="list-sub">${escapeHtml(it.description || '')}</div>
                <div class="list-sub">Price: ${it.price ?? '-'} • Weight: ${it.weight ?? '-'}</div>
              </div>
              <div class="actions">
                <button type="button" class="btn" data-act="edit">Edit</button>
                <button type="button" class="btn" data-act="delete">Delete</button>
              </div>
            </div>
          </li>`
        ));
        qs('#item-results').innerHTML = list;
      } catch (e) {
        qs('#item-results').innerHTML = `<p class="err">${escapeHtml(e.message || 'Search failed')}</p>`;
      }
    }

    async function runAll() {
      qs('#item-results').innerHTML = '<p class="muted">Loading…</p>';
      try {
        const data = await api('/api/items');
        const list = renderList(data, 'No items in catalog yet.', (it) => (
          `<li class="list-item" data-id="${it.id}">
            <div class="row-between">
              <div>
                <div class="list-title">${escapeHtml(it.name || 'Unnamed')}</div>
                <div class="list-sub">${escapeHtml(it.description || '')}</div>
                <div class="list-sub">Price: ${it.price ?? '-'} • Weight: ${it.weight ?? '-'}</div>
              </div>
              <div class="actions">
                <button type="button" class="btn" data-act="edit">Edit</button>
                <button type="button" class="btn" data-act="delete">Delete</button>
              </div>
            </div>
          </li>`
        ));
        qs('#item-results').innerHTML = list;
      } catch (e) {
        qs('#item-results').innerHTML = `<p class="err">${escapeHtml(e.message || 'Load failed')}</p>`;
      }
    }

    async function createItem() {
      const msg = qs('#create-msg');
      setMessage(msg, '', '');
      const name = (qs('#new-name').value || '').trim();
      const description = (qs('#new-desc').value || '').trim();
      const weightStr = (qs('#new-weight').value || '').trim();
      const priceStr = (qs('#new-price').value || '').trim();
      if (!name) { setMessage(msg, 'Name is required', 'err'); return; }
      const body = {
        name,
        description: description || null,
        weight: weightStr ? Number(weightStr) : null,
        price: priceStr ? Number(priceStr) : null
      };
      try {
        await api('/api/items', { method: 'POST', body: JSON.stringify(body) });
        setMessage(msg, 'Item created', 'ok');
        qs('#new-name').value = '';
        qs('#new-desc').value = '';
        qs('#new-weight').value = '';
        qs('#new-price').value = '';
        // refresh results if there is a query
        if ((qs('#item-q').value || '').trim()) runSearch();
      } catch (e) {
        setMessage(msg, e.message || 'Create failed', 'err');
      }
    }

    function bindListActions() {
      const container = qs('#item-results');
      container.addEventListener('click', async (ev) => {
        const btn = ev.target.closest('button[data-act]');
        if (!btn) return;
        const li = ev.target.closest('li.list-item');
        if (!li) return;
        const id = li.getAttribute('data-id');
        const act = btn.getAttribute('data-act');
        if (act === 'delete') {
          if (!confirm('Delete this item?')) return;
          try {
            await api(`/api/items/${encodeURIComponent(id)}`, { method: 'DELETE' });
            li.remove();
          } catch (e) {
            alert(e.message || 'Delete failed');
          }
        }
        if (act === 'edit') {
          openEditor(li);
        }
        if (act === 'save') {
          await saveEditor(li, id);
        }
        if (act === 'cancel') {
          // rerun search to restore
          runSearch();
        }
      });
    }

    function openEditor(li) {
      const title = li.querySelector('.list-title')?.textContent || '';
      const desc = li.querySelectorAll('.list-sub')[0]?.textContent || '';
      const meta = li.querySelectorAll('.list-sub')[1]?.textContent || '';
      const priceMatch = /Price:\s([^•]+)/.exec(meta);
      const weightMatch = /Weight:\s(.*)$/.exec(meta);
      const price = priceMatch ? priceMatch[1].trim() : '';
      const weight = weightMatch ? weightMatch[1].trim() : '';
      li.innerHTML = `
        <div class="edit-grid">
          <input class="edit-name" value="${escapeHtml(title)}" />
          <input class="edit-price" value="${escapeHtml(price)}" placeholder="Price" />
          <input class="edit-weight" value="${escapeHtml(weight)}" placeholder="Weight" />
          <input class="edit-desc" value="${escapeHtml(desc)}" placeholder="Description" />
          <div class="actions">
            <button type="button" class="btn" data-act="save">Save</button>
            <button type="button" class="btn" data-act="cancel">Cancel</button>
          </div>
        </div>
      `;
    }

    async function saveEditor(li, id) {
      const name = (li.querySelector('.edit-name').value || '').trim();
      const description = (li.querySelector('.edit-desc').value || '').trim();
      const weightStr = (li.querySelector('.edit-weight').value || '').trim();
      const priceStr = (li.querySelector('.edit-price').value || '').trim();
      if (!name) { alert('Name is required'); return; }
      const body = {
        name,
        description: description || null,
        weight: weightStr ? Number(weightStr) : null,
        price: priceStr ? Number(priceStr) : null
      };
      try {
        await api(`/api/items/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) });
        // refresh list
        runSearch();
      } catch (e) {
        alert(e.message || 'Update failed');
      }
    }

    qs('#item-search').addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); runSearch(); });
    qs('#item-all').addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); runAll(); });
    qs('#item-q').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); ev.stopPropagation(); runSearch(); } });
    qs('#btn-create-item').addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); createItem(); });
    bindListActions();
    // initial: show full catalog
    runAll();
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


