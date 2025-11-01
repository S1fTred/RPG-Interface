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

  function confirmModal(title, message) {
    return new Promise((resolve) => {
      const overlay = qs('#modal-overlay');
      const titleEl = qs('#modal-title');
      const messageEl = qs('#modal-message');
      const inputEl = qs('#modal-input');
      const confirmBtn = qs('#modal-confirm');
      const cancelBtn = qs('#modal-cancel');
      
      titleEl.textContent = title || 'Confirm';
      messageEl.innerHTML = message || 'Are you sure?';
      messageEl.hidden = false;
      inputEl.hidden = true;
      
      confirmBtn.textContent = 'Confirm';
      confirmBtn.hidden = false;
      cancelBtn.hidden = false;
      confirmBtn.classList.add('primary');
      confirmBtn.classList.remove('danger');
      
      const cleanup = () => {
        overlay.hidden = true;
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
        overlay.onclick = null;
      };
      
      confirmBtn.onclick = () => {
        cleanup();
        resolve(true);
      };
      
      cancelBtn.onclick = () => {
        cleanup();
        resolve(false);
      };
      
      overlay.onclick = (ev) => {
        if (ev.target === overlay) {
          cleanup();
          resolve(false);
        }
      };
      
      overlay.hidden = false;
    });
  }

  function showErrorModal(title, message) {
    return new Promise((resolve) => {
      const overlay = qs('#modal-overlay');
      const titleEl = qs('#modal-title');
      const messageEl = qs('#modal-message');
      const inputEl = qs('#modal-input');
      const confirmBtn = qs('#modal-confirm');
      const cancelBtn = qs('#modal-cancel');
      
      titleEl.textContent = title || 'Error';
      messageEl.innerHTML = message || 'An error occurred';
      inputEl.hidden = true;
      
      confirmBtn.textContent = 'OK';
      confirmBtn.hidden = false;
      cancelBtn.hidden = true;
      confirmBtn.classList.remove('primary');
      confirmBtn.classList.add('danger');
      
      const cleanup = () => {
        overlay.hidden = true;
        confirmBtn.onclick = null;
        overlay.onclick = null;
      };
      
      confirmBtn.onclick = () => {
        cleanup();
        resolve();
      };
      
      overlay.onclick = (ev) => {
        if (ev.target === overlay) {
          cleanup();
          resolve();
        }
      };
      
      overlay.hidden = false;
    });
  }

  function promptModal(title, message, defaultValue = '', inputType = 'text') {
    return new Promise((resolve) => {
      const overlay = qs('#modal-overlay');
      const titleEl = qs('#modal-title');
      const messageEl = qs('#modal-message');
      const inputEl = qs('#modal-input');
      const confirmBtn = qs('#modal-confirm');
      const cancelBtn = qs('#modal-cancel');
      
      titleEl.textContent = title || 'Input';
      messageEl.textContent = message || 'Enter value:';
      messageEl.hidden = false;
      inputEl.hidden = false;
      inputEl.value = defaultValue || '';
      inputEl.type = inputType;
      
      confirmBtn.textContent = 'OK';
      confirmBtn.hidden = false;
      cancelBtn.hidden = false;
      confirmBtn.classList.remove('danger');
      confirmBtn.classList.add('primary');
      
      const cleanup = () => {
        overlay.hidden = true;
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
        overlay.onclick = null;
        inputEl.onkeydown = null;
      };
      
      const handleConfirm = () => {
        const value = inputEl.value;
        cleanup();
        resolve(value);
      };
      
      confirmBtn.onclick = handleConfirm;
      
      cancelBtn.onclick = () => {
        cleanup();
        resolve(null);
      };
      
      inputEl.onkeydown = (ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          handleConfirm();
        } else if (ev.key === 'Escape') {
          ev.preventDefault();
          cleanup();
          resolve(null);
        }
      };
      
      overlay.onclick = (ev) => {
        if (ev.target === overlay) {
          cleanup();
          resolve(null);
        }
      };
      
      overlay.hidden = false;
      inputEl.focus();
      inputEl.select();
    });
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

    async function loadCampaigns(charactersList) {
      try {
        const campaigns = await api('/api/campaigns/participating');
        const characters = charactersList || await api(`/api/characters/by-owner-id/${encodeURIComponent(userId)}`);
        const campaignsWithChar = new Set((characters || []).map(ch => ch.campaignId));
        const sel = qs('#ch-campaign');
        sel.innerHTML = '<option value="">Campaign…</option>' + (campaigns || []).map(c => {
          const hasChar = campaignsWithChar.has(c.id);
          return `<option value="${c.id}" ${hasChar ? 'disabled' : ''}>${escapeHtml(c.name || c.id)}${hasChar ? ' (already has character)' : ''}</option>`;
        }).join('');
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
        await loadCampaigns(); // перезагрузить список кампаний с учетом нового персонажа
        qs('#ch-name').value = '';
        qs('#ch-class').value = '';
        qs('#ch-race').value = '';
        qs('#ch-level').value = '';
        qs('#ch-maxhp').value = '';
        qs('#ch-hp').value = '';
        qs('#ch-str').value = '';
        qs('#ch-dex').value = '';
        qs('#ch-con').value = '';
        qs('#ch-int').value = '';
        qs('#ch-wis').value = '';
        qs('#ch-cha').value = '';
        qs('#ch-campaign').value = '';
      } catch (e) {
        const errorMsg = e.message || 'Create failed';
        setMessage(msg, errorMsg.includes('уже есть персонаж') || errorMsg.includes('already has character') 
          ? 'В этой кампании у вас уже есть персонаж. Один игрок может иметь только одного персонажа в кампании.'
          : errorMsg, 'err');
      }
    }

    function renderCharItem(c) {
      return `
        <li class="list-item" data-id="${c.id}" data-campaign-id="${c.campaignId || ''}">
          <div class="row-between">
            <div>
              <div class="list-title">${escapeHtml(c.name || 'Unnamed')} <span class="list-sub">[${escapeHtml(c.race||'')}/${escapeHtml(c.clazz||'')}]</span></div>
              <div class="list-sub">Level: ${c.level} • HP: ${c.hp}/${c.maxHp} • Campaign: ${c.campaignName ? escapeHtml(c.campaignName) : (c.campaignId ? escapeHtml(c.campaignId) : 'None')}</div>
              <div class="list-sub">STR ${c.attributes?.strength ?? '-'} | DEX ${c.attributes?.dexterity ?? '-'} | CON ${c.attributes?.constitution ?? '-'} | INT ${c.attributes?.intelligence ?? '-'} | WIS ${c.attributes?.wisdom ?? '-'} | CHA ${c.attributes?.charisma ?? '-'}</div>
            </div>
            <div class="actions">
              <button type="button" class="btn" data-act="inventory">Inventory</button>
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
        return data;
      } catch (e) {
        qs('#char-results').innerHTML = `<p class="err">${escapeHtml(e.message || 'Failed to load')}</p>`;
        return [];
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
      
      // Валидация на фронтенде
      const name = (li.querySelector('.ed-name').value || '').trim();
      const str = toInt(li.querySelector('.ed-str').value, null);
      const dex = toInt(li.querySelector('.ed-dex').value, null);
      const con = toInt(li.querySelector('.ed-con').value, null);
      const int = toInt(li.querySelector('.ed-int').value, null);
      const wis = toInt(li.querySelector('.ed-wis').value, null);
      const cha = toInt(li.querySelector('.ed-cha').value, null);
      
      const errors = [];
      if (!name) errors.push('Name is required');
      if (str === null || str < 1 || str > 30) errors.push('Strength must be between 1 and 30');
      if (dex === null || dex < 1 || dex > 30) errors.push('Dexterity must be between 1 and 30');
      if (con === null || con < 1 || con > 30) errors.push('Constitution must be between 1 and 30');
      if (int === null || int < 1 || int > 30) errors.push('Intelligence must be between 1 and 30');
      if (wis === null || wis < 1 || wis > 30) errors.push('Wisdom must be between 1 and 30');
      if (cha === null || cha < 1 || cha > 30) errors.push('Charisma must be between 1 and 30');
      
      if (errors.length > 0) {
        await showErrorModal('Validation Error', errors.map(e => `• ${e}`).join('<br>'));
        return;
      }
      
      const body = {
        name: name || null,
        clazz: (li.querySelector('.ed-class').value || '').trim() || null,
        race: (li.querySelector('.ed-race').value || '').trim() || null,
        level: toInt(li.querySelector('.ed-level').value, null),
        maxHp: toInt(li.querySelector('.ed-maxhp').value, null),
        attributes: {
          strength: str,
          dexterity: dex,
          constitution: con,
          intelligence: int,
          wisdom: wis,
          charisma: cha,
        }
      };
      
      try {
        await api(`/api/characters/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) });
        await runList();
      } catch (e) {
        let errorMsg = e.message || 'Update failed';
        
        // Обработка ошибок валидации с сервера
        if (e.data && typeof e.data === 'object') {
          if (e.data.message) {
            errorMsg = e.data.message;
          } else if (Array.isArray(e.data.errors)) {
            errorMsg = e.data.errors.map(err => err.field ? `${err.field}: ${err.message || err.defaultMessage}` : (err.message || err.defaultMessage)).join('<br>• ') || errorMsg;
            if (errorMsg !== e.message) errorMsg = '• ' + errorMsg;
          } else if (e.data.errors && typeof e.data.errors === 'object') {
            const errList = Object.entries(e.data.errors).map(([field, msgs]) => {
              const msgList = Array.isArray(msgs) ? msgs : [msgs];
              return msgList.map(msg => `${field}: ${msg}`).join('<br>');
            }).join('<br>');
            errorMsg = '• ' + errList;
          }
        }
        
        // Обработка ошибок типа "Validation failed: 8 ошибка(и)"
        if (errorMsg.includes('Validation failed') || errorMsg.includes('ошибка')) {
          errorMsg = 'Please fill all required fields correctly. Attributes must be between 1 and 30.';
        }
        
        await showErrorModal('Update Failed', errorMsg);
      }
    }

    async function setHp(id) {
      const val = await promptModal('Set HP', 'Enter new HP value:', '', 'number');
      if (val == null || val === '') return;
      const hp = Number(val);
      if (!Number.isFinite(hp)) {
        await showErrorModal('Invalid Input', 'HP must be a valid number');
        return;
      }
      if (hp < 0) {
        await showErrorModal('Invalid Input', 'HP cannot be negative');
        return;
      }
      try {
        await api(`/api/characters/${encodeURIComponent(id)}/hp?hp=${encodeURIComponent(hp)}`, { method: 'PATCH' });
        await runList();
      } catch (e) {
        await showErrorModal('Failed to Set HP', e.message || 'Failed to update character HP');
      }
    }

    async function removeChar(id, li) {
      const confirmed = await confirmModal('Delete character', 'Are you sure you want to delete this character? This action cannot be undone.');
      if (!confirmed) return;
      try {
        await api(`/api/characters/${encodeURIComponent(id)}`, { method: 'DELETE' });
        li.remove();
      } catch (e) { alert(e.message || 'Delete failed'); }
    }

    async function showInventory(characterId) {
      try {
        // Получаем информацию о персонаже и инвентарь
        const [character, inventory] = await Promise.all([
          api(`/api/characters/${encodeURIComponent(characterId)}`),
          api(`/api/characters/${encodeURIComponent(characterId)}/inventory`)
        ]);

        const isOwner = character && String(character.ownerId) === String(userId);
        const isGM = auth.roles.includes('GAME_MASTER') || auth.roles.includes('GM');

        // Создаем модальное окно для инвентаря
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'inventory-modal';
        modal.innerHTML = `
          <div class="modal" style="max-width: 700px; width: 90vw; max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h3>Inventory: ${escapeHtml(character?.name || 'Character')}</h3>
              <button type="button" class="btn" id="inv-close" style="min-width: auto; padding: 4px 12px;">Close</button>
            </div>
            
            ${isGM ? `
            <div class="panel" style="margin-bottom: 16px;">
              <h4>Give Item (GM only)</h4>
              <div class="grid-2">
                <select id="inv-item-select" style="width: 100%;">
                  <option value="">Select item…</option>
                </select>
                <input id="inv-quantity" type="number" placeholder="Quantity" min="1" value="1" style="width: 100%;" />
              </div>
              <button type="button" class="btn primary" id="inv-give" style="margin-top: 8px;">Give Item</button>
            </div>
            ` : ''}
            
            <div class="panel">
              <h4>Items</h4>
              <div id="inv-list">
                ${inventory.length === 0 ? '<p class="muted">Inventory is empty.</p>' : ''}
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        modal.hidden = false;

        // Загружаем список предметов для GM
        if (isGM) {
          try {
            const items = await api('/api/items');
            const select = qs('#inv-item-select', modal);
            select.innerHTML = '<option value="">Select item…</option>' + 
              items.map(item => `<option value="${item.id}">${escapeHtml(item.name || item.id)}</option>`).join('');
          } catch (e) {
            console.error('Failed to load items:', e);
          }
        }

        // Рендерим инвентарь
        function renderInventory(inv) {
          const list = qs('#inv-list', modal);
          if (inv.length === 0) {
            list.innerHTML = '<p class="muted">Inventory is empty.</p>';
            return;
          }
          list.innerHTML = inv.map(entry => {
            const item = entry.item || {};
            return `
              <div class="list-item" style="margin-bottom: 8px; padding: 12px; border: 1px solid var(--border); border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div style="flex: 1;">
                    <div class="list-title">${escapeHtml(item.name || 'Unknown Item')} × ${entry.quantity}</div>
                    ${item.description ? `<div class="list-sub">${escapeHtml(item.description)}</div>` : ''}
                    <div class="list-sub">Weight: ${item.weight ?? '-'} • Price: ${item.price ?? '-'}</div>
                  </div>
                  <div style="display: flex; gap: 4px; margin-left: 12px;">
                    ${isGM ? `
                      <input type="number" class="inv-qty-input" data-item-id="${entry.itemId}" 
                             value="${entry.quantity}" min="0" style="width: 60px; padding: 4px;" />
                      <button type="button" class="btn" data-inv-act="set" data-item-id="${entry.itemId}" style="min-width: auto; padding: 4px 12px;">Set</button>
                      <button type="button" class="btn" data-inv-act="remove" data-item-id="${entry.itemId}" style="min-width: auto; padding: 4px 12px;">Remove</button>
                    ` : isOwner ? `
                      <input type="number" class="inv-consume-input" data-item-id="${entry.itemId}" 
                             value="1" min="1" max="${entry.quantity}" style="width: 60px; padding: 4px;" />
                      <button type="button" class="btn" data-inv-act="consume" data-item-id="${entry.itemId}" style="min-width: auto; padding: 4px 12px;">Consume</button>
                      <button type="button" class="btn" data-inv-act="remove" data-item-id="${entry.itemId}" style="min-width: auto; padding: 4px 12px;">Remove All</button>
                    ` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('');
        }

        renderInventory(inventory);

        // Обработчики событий
        qs('#inv-close', modal).addEventListener('click', () => {
          modal.remove();
        });

        if (isGM) {
          qs('#inv-give', modal).addEventListener('click', async () => {
            const itemId = qs('#inv-item-select', modal).value;
            const quantity = parseInt(qs('#inv-quantity', modal).value || '1');
            if (!itemId || quantity < 1) {
              await showErrorModal('Validation Error', 'Please select an item and enter a valid quantity (≥ 1).');
              return;
            }
            try {
              await api(`/api/characters/${encodeURIComponent(characterId)}/inventory`, {
                method: 'POST',
                body: JSON.stringify({ itemId, quantity })
              });
              // Перезагружаем инвентарь
              const updatedInv = await api(`/api/characters/${encodeURIComponent(characterId)}/inventory`);
              renderInventory(updatedInv);
              qs('#inv-item-select', modal).value = '';
              qs('#inv-quantity', modal).value = '1';
            } catch (e) {
              await showErrorModal('Error', e.message || 'Failed to give item');
            }
          });
        }

        // Обработчики для кнопок в списке инвентаря
        qs('#inv-list', modal).addEventListener('click', async (ev) => {
          const btn = ev.target.closest('button[data-inv-act]');
          if (!btn) return;
          ev.preventDefault();
          ev.stopPropagation();
          const act = btn.getAttribute('data-inv-act');
          const itemId = btn.getAttribute('data-item-id');

          try {
            if (act === 'set' && isGM) {
              const input = btn.previousElementSibling;
              const quantity = parseInt(input.value || '0');
              if (quantity < 0) {
                await showErrorModal('Validation Error', 'Quantity must be ≥ 0');
                return;
              }
              await api(`/api/characters/${encodeURIComponent(characterId)}/inventory/${encodeURIComponent(itemId)}`, {
                method: 'PATCH',
                body: JSON.stringify({ itemId, quantity })
              });
              const updatedInv = await api(`/api/characters/${encodeURIComponent(characterId)}/inventory`);
              renderInventory(updatedInv);
            } else if (act === 'consume' && isOwner) {
              const input = btn.previousElementSibling;
              const quantity = parseInt(input.value || '1');
              if (quantity < 1) {
                await showErrorModal('Validation Error', 'Quantity must be ≥ 1');
                return;
              }
              await api(`/api/characters/${encodeURIComponent(characterId)}/inventory/${encodeURIComponent(itemId)}`, {
                method: 'DELETE',
                body: JSON.stringify({ itemId, quantity })
              });
              const updatedInv = await api(`/api/characters/${encodeURIComponent(characterId)}/inventory`);
              renderInventory(updatedInv);
            } else if (act === 'remove') {
              const confirmed = await confirmModal('Remove Item', 
                'Are you sure you want to remove this item completely from inventory?');
              if (!confirmed) return;
              
              await api(`/api/characters/${encodeURIComponent(characterId)}/inventory/${encodeURIComponent(itemId)}`, {
                method: 'DELETE'
              });
              const updatedInv = await api(`/api/characters/${encodeURIComponent(characterId)}/inventory`);
              renderInventory(updatedInv);
            }
          } catch (e) {
            await showErrorModal('Error', e.message || 'Operation failed');
          }
        });

        // Закрытие по клику на фон
        modal.addEventListener('click', (ev) => {
          if (ev.target === modal) {
            modal.remove();
          }
        });

      } catch (e) {
        await showErrorModal('Error', e.message || 'Failed to load inventory');
      }
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
        if (act === 'inventory') await showInventory(id);
        if (act === 'edit') openEdit(li);
        if (act === 'save') await saveEdit(li);
        if (act === 'cancel') await runList();
        if (act === 'hp') await setHp(id);
        if (act === 'delete') await removeChar(id, li);
      });
    }

    const characters = await runList();
    await loadCampaigns(characters);
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
      
      // Валидация на фронтенде
      const errors = [];
      if (!name) errors.push('Name is required');
      
      if (weightStr) {
        const weight = Number(weightStr);
        if (!Number.isFinite(weight)) {
          errors.push('Weight must be a valid number');
        } else if (weight < 0) {
          errors.push('Weight cannot be negative');
        }
      }
      
      if (priceStr) {
        const price = Number(priceStr);
        if (!Number.isFinite(price)) {
          errors.push('Price must be a valid number');
        } else if (price < 0) {
          errors.push('Price cannot be negative');
        } else if (!Number.isInteger(price)) {
          errors.push('Price must be an integer');
        }
      }
      
      if (errors.length > 0) {
        await showErrorModal('Validation Error', errors.map(e => `• ${e}`).join('<br>'));
        return;
      }
      
      const body = {
        name,
        description: description || null,
        weight: weightStr ? Number(weightStr) : null,
        price: priceStr ? Number.parseInt(priceStr, 10) : null
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
        else runAll();
      } catch (e) {
        let errorMsg = e.message || 'Create failed';
        
        // Обработка ошибок валидации с сервера
        if (e.data && typeof e.data === 'object') {
          if (e.data.message) {
            errorMsg = e.data.message;
          } else if (Array.isArray(e.data.errors)) {
            errorMsg = e.data.errors.map(err => err.field ? `${err.field}: ${err.message || err.defaultMessage}` : (err.message || err.defaultMessage)).join('<br>• ') || errorMsg;
            if (errorMsg !== e.message) errorMsg = '• ' + errorMsg;
          } else if (e.data.errors && typeof e.data.errors === 'object') {
            const errList = Object.entries(e.data.errors).map(([field, msgs]) => {
              const msgList = Array.isArray(msgs) ? msgs : [msgs];
              return msgList.map(msg => `${field}: ${msg}`).join('<br>');
            }).join('<br>');
            errorMsg = '• ' + errList;
          }
        }
        
        // Обработка ошибок типа "Validation failed: 8 ошибка(и)"
        if (errorMsg.includes('Validation failed') || errorMsg.includes('ошибка')) {
          errorMsg = 'Please fill all required fields correctly. Name is required. Weight and Price must be non-negative numbers.';
        }
        
        await showErrorModal('Create Failed', errorMsg);
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
          const confirmed = await confirmModal('Delete item', 'Are you sure you want to delete this item? This action cannot be undone.');
          if (!confirmed) return;
          try {
            await api(`/api/items/${encodeURIComponent(id)}`, { method: 'DELETE' });
            li.remove();
          } catch (e) {
            await showErrorModal('Delete Failed', e.message || 'Failed to delete item');
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
      
      // Валидация на фронтенде
      const errors = [];
      if (!name) errors.push('Name is required');
      
      if (weightStr) {
        const weight = Number(weightStr);
        if (!Number.isFinite(weight)) {
          errors.push('Weight must be a valid number');
        } else if (weight < 0) {
          errors.push('Weight cannot be negative');
        }
      }
      
      if (priceStr) {
        const price = Number(priceStr);
        if (!Number.isFinite(price)) {
          errors.push('Price must be a valid number');
        } else if (price < 0) {
          errors.push('Price cannot be negative');
        } else if (!Number.isInteger(price)) {
          errors.push('Price must be an integer');
        }
      }
      
      if (errors.length > 0) {
        await showErrorModal('Validation Error', errors.map(e => `• ${e}`).join('<br>'));
        return;
      }
      
      const body = {
        name,
        description: description || null,
        weight: weightStr ? Number(weightStr) : null,
        price: priceStr ? Number.parseInt(priceStr, 10) : null
      };
      
      try {
        await api(`/api/items/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) });
        // refresh list
        const q = (qs('#item-q').value || '').trim();
        if (q) runSearch();
        else runAll();
      } catch (e) {
        let errorMsg = e.message || 'Update failed';
        
        // Обработка ошибок валидации с сервера
        if (e.data && typeof e.data === 'object') {
          if (e.data.message) {
            errorMsg = e.data.message;
          } else if (Array.isArray(e.data.errors)) {
            errorMsg = e.data.errors.map(err => err.field ? `${err.field}: ${err.message || err.defaultMessage}` : (err.message || err.defaultMessage)).join('<br>• ') || errorMsg;
            if (errorMsg !== e.message) errorMsg = '• ' + errorMsg;
          } else if (e.data.errors && typeof e.data.errors === 'object') {
            const errList = Object.entries(e.data.errors).map(([field, msgs]) => {
              const msgList = Array.isArray(msgs) ? msgs : [msgs];
              return msgList.map(msg => `${field}: ${msg}`).join('<br>');
            }).join('<br>');
            errorMsg = '• ' + errList;
          }
        }
        
        // Обработка ошибок типа "Validation failed: 8 ошибка(и)"
        if (errorMsg.includes('Validation failed') || errorMsg.includes('ошибка')) {
          errorMsg = 'Please fill all required fields correctly. Name is required. Weight and Price must be non-negative numbers.';
        }
        
        await showErrorModal('Update Failed', errorMsg);
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


