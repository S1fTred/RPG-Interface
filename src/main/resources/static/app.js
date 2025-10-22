const API_BASE = location.origin.replace(/\/$/, ''); // same origin by default

const storage = {
    get access() { return localStorage.getItem('access'); },
    set access(v) { v?localStorage.setItem('access', v):localStorage.removeItem('access'); },
    get refresh() { return localStorage.getItem('refresh'); },
    set refresh(v) { v?localStorage.setItem('refresh', v):localStorage.removeItem('refresh'); },
    get user() { try {return JSON.parse(localStorage.getItem('user')||'null')} catch(e){return null} },
    set user(v) { v?localStorage.setItem('user', JSON.stringify(v)):localStorage.removeItem('user'); }
};

function $(sel, root=document) { return root.querySelector(sel); }
function el(tag, attrs={}, ...children) {
    const node = document.createElement(tag);
    for (const [k,v] of Object.entries(attrs)) {
        if (k === 'class') node.className = v;
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else if (v !== null && v !== undefined) node.setAttribute(k, v);
    }
    for (const ch of children.flat()) node.append(ch.nodeType? ch : document.createTextNode(ch));
    return node;
}

const api = {
    async request(path, {method='GET', body, headers}={}) {
        const h = Object.assign({'Content-Type':'application/json'}, headers||{});
        if (storage.access) h['Authorization'] = `Bearer ${storage.access}`;
        const res = await fetch(`${API_BASE}${path}`, { method, headers: h, body: body?JSON.stringify(body):undefined });
        if (res.status === 401 && storage.refresh) {
            // try refresh once
            const ok = await api.refreshToken();
            if (ok) return api.request(path, {method, body, headers});
        }
        if (!res.ok) {
            let msg = `${res.status}`;
            try { const data = await res.json(); msg += `: ${data.message||JSON.stringify(data)}` } catch {}
            throw new Error(msg);
        }
        const ct = res.headers.get('content-type')||'';
        return ct.includes('application/json')? res.json() : res.text();
    },
    async login({username, password}) {
        const data = await this.request('/auth/login', {method:'POST', body:{username, password}});
        storage.access = data.accessToken || data.access || data.token;
        storage.refresh = data.refreshToken || data.refresh;
        storage.user = data.user || {id: data.userId, username: data.username, roles: data.roles};
        return data;
    },
    async register({username, email, password}) {
        return this.request('/auth/register', {method:'POST', body:{username, email, password}});
    },
    async refreshToken() {
        try {
            const data = await this.request('/auth/refresh', {method:'POST', body:{refreshToken: storage.refresh}});
            storage.access = data.accessToken || data.access;
            storage.refresh = data.refreshToken || storage.refresh;
            return true;
        } catch(e) {
            console.warn('Refresh failed', e);
            storage.access = storage.refresh = null; storage.user = null;
            return false;
        }
    },

    // Campaigns
    listCampaigns() { return this.request('/api/campaigns'); },
    createCampaign({name, description}) { return this.request('/api/campaigns', {method:'POST', body:{name, description}}); },
    getCampaign(id) { return this.request(`/api/campaigns/${id}`); },
    updateCampaign(id, patch) { return this.request(`/api/campaigns/${id}`, {method:'PATCH', body:patch}); },
    deleteCampaign(id) { return this.request(`/api/campaigns/${id}`, {method:'DELETE'}); },
    listMembers(campaignId) { return this.request(`/api/campaigns/${campaignId}/members`); },
    upsertMember(campaignId, userId, roleInCampaign) { return this.request(`/api/campaigns/${campaignId}/members/${userId}`, {method:'PUT', body:{roleInCampaign}}); },
    patchMember(campaignId, userId, roleInCampaign) { return this.request(`/api/campaigns/${campaignId}/members/${userId}`, {method:'PATCH', body:{roleInCampaign}}); },
    removeMember(campaignId, userId) { return this.request(`/api/campaigns/${campaignId}/members/${userId}`, {method:'DELETE'}); },

    // Characters
    createCharacter(campaignId, payload) { return this.request(`/api/campaigns/${campaignId}/characters`, {method:'POST', body:payload}); },
    getCharacter(id) { return this.request(`/api/characters/${id}`); },
    patchCharacter(id, patch) { return this.request(`/api/characters/${id}`, {method:'PATCH', body:patch}); },
    patchHp(id, hp) { return this.request(`/api/characters/${id}/hp?hp=${encodeURIComponent(hp)}`, {method:'PATCH'}); },
    deleteCharacter(id) { return this.request(`/api/characters/${id}`, {method:'DELETE'}); },

    // Journal
    listJournal(campaignId, include='player') { return this.request(`/api/campaigns/${campaignId}/journal?include=${include}`); },
    createJournal(campaignId, payload) { return this.request(`/api/campaigns/${campaignId}/journal`, {method:'POST', body:payload}); },
    patchJournal(campaignId, entryId, patch) { return this.request(`/api/campaigns/${campaignId}/journal/${entryId}`, {method:'PATCH', body:patch}); },
    deleteJournal(campaignId, entryId) { return this.request(`/api/campaigns/${campaignId}/journal/${entryId}`, {method:'DELETE'}); },

    // Items (ADMIN)
    listItems() { return this.request('/api/items'); },
    createItem(payload) { return this.request('/api/items', {method:'POST', body:payload}); },
    patchItem(id, patch) { return this.request(`/api/items/${id}`, {method:'PATCH', body:patch}); },
    deleteItem(id) { return this.request(`/api/items/${id}`, {method:'DELETE'}); },
};

/*************
 * Router
 *************/
const routes = {};
function route(path, render) { routes[path] = render; }
function go(path) { history.pushState({}, '', `#${path}`); render(); }
window.addEventListener('popstate', render);
window.addEventListener('hashchange', render);

function requireAuth(renderFn) {
    return () => {
        if (!storage.access) return views.auth();
        return renderFn();
    };
}

/*************
 * Views
 *************/
const view = $('#view');
const logoutBtn = $('#logoutBtn');
logoutBtn.addEventListener('click', () => { storage.access=null; storage.refresh=null; storage.user=null; updateTopbar(); go('auth'); });

function updateTopbar() {
    const user = storage.user;
    if (user) {
        $('#roleChip').textContent = (user.roles||[]).join(', ') || 'AUTH';
        logoutBtn.classList.remove('hidden');
    } else {
        $('#roleChip').textContent = 'Гость';
        logoutBtn.classList.add('hidden');
    }
}

const views = {
    auth() {
        document.title = 'Вход / Регистрация — Tabletop RPG Interface';
        view.innerHTML = '';
        view.append(
            el('div', {class:'grid cols-2'},
                el('div', {class:'panel'},
                    el('h2', {}, 'Вход'),
                    formLogin()
                ),
                el('div', {class:'panel'},
                    el('h2', {}, 'Регистрация'),
                    formRegister()
                ),
            )
        );
    },

    dashboard: requireAuth(async () => {
        document.title = 'Кампании — Tabletop RPG Interface';
        view.innerHTML = '';

        const wrapper = el('div', {class:'grid', style:'gap:20px;'});
        const header = el('div', {class:'panel'},
            el('div', {class:'toolbar'},
                el('h2', {style:'margin:0;flex:1'}, 'Мои кампании (GM)'),
                el('button', {class:'btn primary', onclick: () => showCreateCampaignModal()}, 'Создать кампанию')
            )
        );
        wrapper.append(header);

        const listPanel = el('div', {class:'panel'});
        listPanel.append(el('div', {class:'muted', id:'campaignListInfo'}, 'Загружаем…'));
        const table = el('table');
        table.append(el('thead', {}, el('tr', {}, el('th', {}, 'Название'), el('th', {}, 'Описание'), el('th', {}, 'Действия'))));
        const tbody = el('tbody');
        table.append(tbody);
        listPanel.append(table);
        wrapper.append(listPanel);
        view.append(wrapper);

        try {
            const data = await api.listCampaigns();
            $('#campaignListInfo').remove();
            if (!data || data.length === 0) listPanel.prepend(el('div', {class:'alert warn'}, 'Пока нет кампаний. Создайте первую.'));
            for (const c of data) {
                tbody.append(el('tr', {},
                    el('td', {}, c.name),
                    el('td', {}, c.description||''),
                    el('td', {},
                        el('div', {class:'toolbar'},
                            el('button', {class:'btn small', onclick: () => go(`campaign/${c.id}`)}, 'Открыть'),
                            el('button', {class:'btn small ghost', onclick: async () => { const name = prompt('Новое имя', c.name)||c.name; const description = prompt('Описание', c.description||'')||''; await api.updateCampaign(c.id,{name,description}); render(); }}, 'Переименовать'),
                            el('button', {class:'btn small danger', onclick: async () => { if (confirm('Удалить кампанию?')) { await api.deleteCampaign(c.id); render(); } }}, 'Удалить')
                        )
                    )
                ));
            }
        } catch(e) {
            listPanel.prepend(el('div', {class:'alert err'}, `Ошибка загрузки: ${e.message}`));
        }
    }),

    campaign: requireAuth(async (id) => {
        document.title = 'Кампания — Tabletop RPG Interface';
        view.innerHTML = '';

        const [details, members] = await Promise.all([
            api.getCampaign(id),
            api.listMembers(id)
        ]);

        const head = el('div', {class:'panel'},
            el('div', {class:'toolbar'},
                el('h2', {style:'margin:0;flex:1'}, details.name),
                el('span', {class:'tag'}, `GM: ${details.gm?.username || details.gm || '—'}`),
                el('button', {class:'btn', onclick: () => showCreateCharacterModal(id)}, 'Создать персонажа'),
                el('button', {class:'btn ghost', onclick: () => go('dashboard')}, 'Назад')
            ),
            el('div', {class:'muted'}, details.description||'')
        );

        const membersPanel = el('div', {class:'panel'},
            el('div', {class:'toolbar'},
                el('h3', {style:'margin:0;flex:1'}, 'Участники'),
                el('button', {class:'btn small', onclick: () => showAddMemberModal(id)}, 'Добавить участника')
            ),
            el('table', {},
                el('thead', {}, el('tr', {}, el('th', {}, 'Пользователь'), el('th', {}, 'Роль'), el('th', {}, 'Действия'))),
                el('tbody', {}, ...members.map(m => el('tr', {},
                    el('td', {}, m.user?.username || m.userId || 'user'),
                    el('td', {}, m.roleInCampaign),
                    el('td', {}, el('div', {class:'toolbar'},
                        el('button', {class:'btn small ghost', onclick: async ()=>{ const r = prompt('Новая роль (GM/PLAYER)', m.roleInCampaign)||m.roleInCampaign; await api.patchMember(id, m.user?.id || m.userId, r); render(); }}, 'Изменить роль'),
                        el('button', {class:'btn small danger', onclick: async ()=>{ if (confirm('Удалить участника?')) { await api.removeMember(id, m.user?.id || m.userId); render(); } }}, 'Удалить')
                    )))
                ))
            )
        );

        const journalPanel = el('div', {class:'panel'},
            el('div', {class:'toolbar'},
                el('h3', {style:'margin:0;flex:1'}, 'Журнал'),
                el('button', {class:'btn small', onclick: () => showCreateJournalModal(id)}, 'Новая запись')
            ),
            el('div', {id:'journalList'}, 'Загружаем журнал…')
        );

        view.append(el('div', {class:'grid', style:'gap:20px'}, head, membersPanel, journalPanel));

        // load journal
        try {
            const entries = await api.listJournal(id, 'all');
            const box = $('#journalList');
            box.innerHTML = '';
            if (!entries || entries.length===0) box.append(el('div', {class:'muted'}, 'Пока пусто.'));
            else entries.forEach(en => box.append(journalCard(id, en)));
        } catch(e) {
            $('#journalList').innerHTML = '';
            $('#journalList').append(el('div',{class:'alert err'}, `Ошибка загрузки журнала: ${e.message}`));
        }
    }),

    character: requireAuth(async (id) => {
        document.title = 'Персонаж — Tabletop RPG Interface';
        view.innerHTML = '';
        try {
            const ch = await api.getCharacter(id);
            const head = el('div', {class:'panel'},
                el('div', {class:'toolbar'},
                    el('h2', {style:'margin:0;flex:1'}, ch.name),
                    el('span', {class:'tag'}, `${ch.race} ${ch.clazz}`),
                    el('span', {class:'tag'}, `ур. ${ch.level}`),
                    el('span', {class:'tag'}, `HP: ${ch.hp}/${ch.maxHp}`),
                    el('button', {class:'btn small', onclick: async ()=> { const hp = prompt('Новое HP', ch.hp); if(hp!==null) { await api.patchHp(ch.id, Number(hp)); render(); } }}, 'Изменить HP'),
                    el('button', {class:'btn ghost small', onclick: ()=> go(`campaign/${ch.campaign?.id||ch.campaignId}`)}, 'К кампании')
                )
            );

            const attrs = ch.attributes || {};
            const attrsCard = el('div', {class:'card'},
                el('h4', {}, 'Характеристики'),
                el('table', {},
                    el('tbody', {}, ...['strength','dexterity','constitution','intelligence','wisdom','charisma'].map(k =>
                        el('tr',{}, el('td',{},k.toUpperCase()), el('td',{}, attrs[k]))
                    ))
                )
            );

            view.append(el('div', {class:'grid'}, head, attrsCard));
        } catch(e) {
            view.append(el('div', {class:'alert err'}, `Не удалось загрузить персонажа: ${e.message}`));
        }
    }),

    items: requireAuth(async () => {
        document.title = 'Предметы (ADMIN) — Tabletop RPG Interface';
        view.innerHTML = '';
        const panel = el('div', {class:'panel'});
        const head = el('div', {class:'toolbar'},
            el('h2', {style:'margin:0;flex:1'}, 'Справочник предметов'),
            el('button', {class:'btn small', onclick: () => showCreateItemModal()}, 'Добавить предмет'),
            el('button', {class:'btn ghost small', onclick: () => go('dashboard')}, 'Назад')
        );
        panel.append(head);
        const table = el('table');
        const tbody = el('tbody');
        table.append(el('thead',{}, el('tr',{}, el('th',{},'Название'), el('th',{},'Вес'), el('th',{},'Цена'), el('th',{},'Действия'))));
        table.append(tbody);
        panel.append(table);
        view.append(panel);

        try {
            const items = await api.listItems();
            for (const it of items) {
                tbody.append(el('tr',{},
                    el('td',{}, it.name),
                    el('td',{}, it.weight),
                    el('td',{}, it.price),
                    el('td',{}, el('div',{class:'toolbar'},
                        el('button',{class:'btn small ghost', onclick: async ()=>{
                                const name = prompt('Название', it.name)||it.name;
                                const weight = Number(prompt('Вес', it.weight)||it.weight);
                                const price = Number(prompt('Цена', it.price)||it.price);
                                const description = prompt('Описание', it.description||'')||'';
                                await api.patchItem(it.id, {name, weight, price, description}); render();
                            }}, 'Изменить'),
                        el('button',{class:'btn small danger', onclick: async ()=>{ if(confirm('Удалить предмет?')){ await api.deleteItem(it.id); render(); } }}, 'Удалить')
                    ))
                ));
            }
        } catch(e) {
            panel.append(el('div', {class:'alert err'}, `Ошибка: ${e.message}`));
        }
    })
};

/*************
 * Components / Helpers
 *************/
function formLogin() {
    const form = el('form', {class:'form', onsubmit: async e => {
                e.preventDefault();
                const btn = $('button[type="submit"]', form);
                btn.disabled = true; btn.textContent = 'Входим…';
                try {
                    await api.login({username: form.username.value, password: form.password.value});
                    updateTopbar();
                    go('dashboard');
                } catch(e) {
                    form.prepend(el('div', {class:'alert err'}, `Ошибка входа: ${e.message}`));
                } finally { btn.disabled=false; btn.textContent = 'Войти'; }
            }},
        el('div', {class:'field'}, el('label', {}, 'Имя пользователя'), el('input', {name:'username', type:'text', required:true})),
        el('div', {class:'field'}, el('label', {}, 'Пароль'), el('input', {name:'password', type:'password', required:true})),
        el('div', {}, el('button', {class:'btn primary', type:'submit'}, 'Войти'))
    );
    return form;
}

function formRegister() {
    const form = el('form', {class:'form', onsubmit: async e => {
                e.preventDefault();
                const btn = $('button[type="submit"]', form);
                btn.disabled = true; btn.textContent = 'Регистрируем…';
                try {
                    await api.register({username: form.username.value, email: form.email.value, password: form.password.value});
                    form.prepend(el('div', {class:'alert ok'}, 'Успешно. Теперь можете войти.'));
                } catch(e) {
                    form.prepend(el('div', {class:'alert err'}, `Ошибка регистрации: ${e.message}`));
                } finally { btn.disabled=false; btn.textContent = 'Зарегистрироваться'; }
            }},
        el('div', {class:'row'},
            el('div', {class:'field'}, el('label', {}, 'Имя пользователя'), el('input', {name:'username', type:'text', required:true})),
            el('div', {class:'field'}, el('label', {}, 'Email'), el('input', {name:'email', type:'text', required:true}))
        ),
        el('div', {class:'field'}, el('label', {}, 'Пароль'), el('input', {name:'password', type:'password', required:true, minlength:6})),
        el('div', {}, el('button', {class:'btn primary', type:'submit'}, 'Зарегистрироваться'))
    );
    return form;
}

function showCreateCampaignModal() {
    const name = prompt('Название кампании'); if (!name) return;
    const description = prompt('Описание')||'';
    api.createCampaign({name, description}).then(()=>render()).catch(e=>alert('Ошибка: '+e.message));
}
function showAddMemberModal(campaignId) {
    const userId = prompt('ID пользователя'); if(!userId) return;
    const role = prompt('Роль в кампании (GM/PLAYER)','PLAYER')||'PLAYER';
    api.upsertMember(campaignId, userId, role).then(()=>render()).catch(e=>alert('Ошибка: '+e.message));
}
function showCreateCharacterModal(campaignId) {
    const name = prompt('Имя персонажа'); if(!name) return;
    const clazz = prompt('Класс','Fighter')||'Fighter';
    const race = prompt('Раса','Human')||'Human';
    const level = Number(prompt('Уровень',1)||1);
    const maxHp = Number(prompt('Max HP',10)||10);
    const hp = maxHp;
    const attributes = {
        strength: Number(prompt('STR',10)||10),
        dexterity: Number(prompt('DEX',10)||10),
        constitution: Number(prompt('CON',10)||10),
        intelligence: Number(prompt('INT',10)||10),
        wisdom: Number(prompt('WIS',10)||10),
        charisma: Number(prompt('CHA',10)||10),
    };
    api.createCharacter(campaignId, {name, clazz, race, level, hp, maxHp, attributes}).then(()=>render()).catch(e=>alert('Ошибка: '+e.message));
}
function showCreateJournalModal(campaignId) {
    const title = prompt('Заголовок'); if(!title) return;
    const type = prompt('Тип (LORE/NARRATIVE/SESSION_LOG)','SESSION_LOG')||'SESSION_LOG';
    const visibility = prompt('Видимость (PLAYERS/GM_ONLY)','PLAYERS')||'PLAYERS';
    const content = prompt('Содержимое')||'';
    const tags = (prompt('Теги через запятую')||'').split(',').map(s=>s.trim()).filter(Boolean);
    api.createJournal(campaignId, {title, type, visibility, content, tags}).then(()=>render()).catch(e=>alert('Ошибка: '+e.message));
}
function journalCard(campaignId, en) {
    return el('div', {class:'card'},
        el('div', {class:'toolbar'},
            el('h4', {style:'margin:0;flex:1'}, en.title),
            el('span', {class:'tag'}, en.type),
            el('span', {class:'tag'}, en.visibility),
            el('button', {class:'btn small ghost', onclick: async ()=>{
                    const title = prompt('Заголовок', en.title)||en.title;
                    const content = prompt('Контент', en.content||'')||'';
                    await api.patchJournal(campaignId, en.id, {title, content});
                    render();
                }}, 'Изменить'),
            el('button', {class:'btn small danger', onclick: async ()=>{ if (confirm('Удалить запись?')) { await api.deleteJournal(campaignId, en.id); render(); } }}, 'Удалить')
        ),
        el('div', {class:'muted'}, (en.tags||[]).map(t=>`#${t}`).join(' ')),
        el('p', {}, en.content||'')
    );
}
function showCreateItemModal() {
    const name = prompt('Название'); if(!name) return;
    const description = prompt('Описание')||'';
    const weight = Number(prompt('Вес', 1)||1);
    const price = Number(prompt('Цена', 1)||1);
    api.createItem({name, description, weight, price}).then(()=>render()).catch(e=>alert('Ошибка: '+e.message));
}

/*************
 * Boot
 *************/
route('auth', views.auth);
route('', () => storage.access ? views.dashboard() : views.auth());
route('dashboard', views.dashboard);
route('campaign/:id', ({params}) => views.campaign(params.id));
route('character/:id', ({params}) => views.character(params.id));
route('items', views.items);

function parseHash() {
    const hash = (location.hash||'').replace(/^#/, '');
    return hash;
}
function matchRoute(path) {
    const current = parseHash();
    if (path === current) return { ok:true, params:{} };
    const pSeg = path.split('/');
    const cSeg = current.split('/');
    if (pSeg.length !== cSeg.length) return {ok:false};
    const params = {};
    for (let i=0;i<pSeg.length;i++) {
        if (pSeg[i].startsWith(':')) params[pSeg[i].slice(1)] = cSeg[i];
        else if (pSeg[i] !== cSeg[i]) return {ok:false};
    }
    return {ok:true, params};
}
async function render() {
    updateTopbar();
    const hash = parseHash();
    for (const [path, fn] of Object.entries(routes)) {
        const {ok, params} = matchRoute(path);
        if (ok) {
            const result = fn.length ? await fn({params}) : await fn();
            return result;
        }
    }
    // fallback
    if (storage.access) return views.dashboard();
    return views.auth();
}

updateTopbar();
render();

// Keyboard shortcuts for power users
window.addEventListener('keydown', (e) => {
    if (e.key === 'k' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); const dest = prompt('Перейти к: auth | dashboard | items | campaign/<id> | character/<id>'); if(dest) go(dest); }
});