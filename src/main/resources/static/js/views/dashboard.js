// views/dashboard.js
import { mount, navigate } from '../app.js';
import { me } from '../auth.js';

function authHeaders() {
    const u = me();
    return {
        'Content-Type': 'application/json',
        ...(u?.accessToken ? { 'Authorization': 'Bearer ' + u.accessToken } : {})
    };
}

function section(title) {
    const wrap = document.createElement('section');
    wrap.className = 'card';
    const h = document.createElement('h2');
    h.textContent = title;
    wrap.append(h);
    const body = document.createElement('div');
    body.className = 'card-body';
    wrap.append(body);
    return { wrap, body };
}

function list(items, emptyText) {
    const ul = document.createElement('ul');
    ul.className = 'list';
    if (!items || items.length === 0) {
        const li = document.createElement('li');
        li.className = 'muted';
        li.textContent = emptyText;
        ul.append(li);
        return ul;
    }
    items.forEach(it => ul.append(it));
    return ul;
}

export async function renderDashboard() {
    const u = me();
    const root = document.createElement('div');
    root.className = 'container';
    const title = document.createElement('h1');
    title.textContent = u ? `Привет, ${u.username}!` : 'Главная';
    root.append(title);

    if (!u) {
        const info = document.createElement('p');
        info.textContent = 'Пожалуйста, войдите, чтобы видеть ваши данные.';
        root.append(info);
        return mount(root);
    }

    // --- СЕКЦИЯ: Мои персонажи ---
    const sChars = section('Мои персонажи');
    root.append(sChars.wrap);

    // --- СЕКЦИЯ: Мои кампании (я — GM) ---
    const sCamps = section('Мои кампании (я — GM)');
    root.append(sCamps.wrap);

    // --- СЕКЦИЯ: Последние журналы (по моим кампаниям) ---
    const sJournals = section('Последние журналы моих кампаний');
    root.append(sJournals.wrap);

    // Показать сразу "скелетоны"
    sChars.body.innerHTML = '<div class="skeleton">Загрузка персонажей…</div>';
    sCamps.body.innerHTML = '<div class="skeleton">Загрузка кампаний…</div>';
    sJournals.body.innerHTML = '<div class="skeleton">Загрузка журналов…</div>';

    mount(root);

    try {
        // 1) Персонажи текущего пользователя
        const rChars = await fetch(`/api/characters/by-owner-id/${u.id}`, { headers: authHeaders() });
        const chars = rChars.ok ? await rChars.json() : [];
        sChars.body.innerHTML = '';
        sChars.body.append(
            list(
                chars.map(c => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.href = 'javascript:void(0)';
                    a.textContent = `${c.name} • ${c.clazz} • ${c.race} • HP ${c.hp}/${c.maxHp}`;
                    a.addEventListener('click', () => navigate(`/character?id=${c.id}`));
                    li.append(a);
                    return li;
                }),
                'Пока нет персонажей'
            )
        );

        // 2) Мои кампании (как GM) — /api/campaigns
        const rCamps = await fetch('/api/campaigns', { headers: authHeaders() });
        const camps = rCamps.ok ? await rCamps.json() : [];
        sCamps.body.innerHTML = '';
        sCamps.body.append(
            list(
                camps.map(c => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.href = 'javascript:void(0)';
                    a.textContent = c.name;
                    a.addEventListener('click', () => navigate(`/campaign?id=${c.id}`));
                    li.append(a);
                    if (c.description) {
                        const small = document.createElement('div');
                        small.className = 'muted';
                        small.textContent = c.description;
                        li.append(small);
                    }
                    return li;
                }),
                'Кампаний пока нет'
            )
        );

        // 3) Последние журналы по моим кампаниям (как GM)
        //    соберём записи с include=all для каждой кампании, отсортируем, ограничим 10.
        let journalItems = [];
        for (const camp of camps) {
            const rJ = await fetch(`/api/campaigns/${camp.id}/journal?include=all`, { headers: authHeaders() });
            if (rJ.ok) {
                const arr = await rJ.json();
                // пометим кампанию в каждом элементе
                arr.forEach(e => journalItems.push({ ...e, _campaign: camp }));
            }
            // если журналов очень много — можно выйти по лимиту
            if (journalItems.length > 30) break;
        }
        journalItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        journalItems = journalItems.slice(0, 10);

        sJournals.body.innerHTML = '';
        sJournals.body.append(
            list(
                journalItems.map(j => {
                    const li = document.createElement('li');
                    const title = document.createElement('a');
                    title.href = 'javascript:void(0)';
                    title.textContent = `${j.title || '(без названия)'} — ${j.type} — ${j.visibility}`;
                    title.addEventListener('click', () => navigate(`/campaign?id=${j._campaign.id}`));
                    const cap = document.createElement('div');
                    cap.className = 'muted';
                    const when = new Date(j.createdAt).toLocaleString();
                    cap.textContent = `${j._campaign.name} • ${when}`;
                    li.append(title, cap);
                    return li;
                }),
                camps.length ? 'Журналов пока нет' : 'Сначала создайте кампанию'
            )
        );
    } catch (e) {
        // Минимальная обработка
        sChars.body.innerHTML = '<div class="error">Не удалось загрузить данные. Проверьте подключение.</div>';
        sCamps.body.innerHTML = '<div class="error">Не удалось загрузить данные. Проверьте подключение.</div>';
        sJournals.body.innerHTML = '<div class="error">Не удалось загрузить данные. Проверьте подключение.</div>';
        // Для отладки:
        console.error(e);
    }
}
