// src/main/resources/static/js/views/dashboard.js
import { mount } from '../app.js';
import { me } from '../auth.js';
import { api } from '../api.js';
import { navigate } from '../router.js';
import { el, card, toast, skeleton } from '../ui.js';

function section(title) {
    const wrap = el('section', { class: 'card' });
    wrap.append(el('h2', {}, title));
    const body = el('div', { class: 'card-body' });
    wrap.append(body);
    return { wrap, body };
}

function list(items, emptyText) {
    const ul = el('ul', { class: 'list' });
    if (!items || items.length === 0) {
        const li = el('li', { class: 'muted' }, emptyText);
        ul.append(li);
        return ul;
    }
    items.forEach(it => ul.append(it));
    return ul;
}

export async function renderDashboard() {
    const u = me();
    const root = el('div', { class: 'container' });
    root.append(el('h1', {}, u ? `Привет, ${u.username}!` : 'Главная'));

    if (!u) {
        root.append(el('p', {}, 'Пожалуйста, войдите, чтобы видеть ваши данные.'));
        return mount(root);
    }

    // Секции
    const sChars = section('Мои персонажи');
    const sCamps = section('Мои кампании (я — GM)');
    const sJournals = section('Последние журналы моих кампаний');

    // Скелетоны
    sChars.body.append(skeleton(1));
    sCamps.body.append(skeleton(1));
    sJournals.body.append(skeleton(1));

    root.append(sChars.wrap, sCamps.wrap, sJournals.wrap);
    mount(root);

    try {
        // Параллельно грузим персонажей и кампании
        const [chars, camps] = await Promise.all([
            api.get(`/api/characters/by-owner-id/${u.id}`).catch(() => []),
            api.get('/api/campaigns').catch(() => []),
        ]);

        // ---- Персонажи
        sChars.body.innerHTML = '';
        sChars.body.append(
            list(
                (chars || []).map(c => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.href = 'javascript:void(0)';
                    a.textContent = `${c.name} • ${c.clazz} • ${c.race} • HP ${c.hp}/${c.maxHp}`;
                    a.addEventListener('click', () => navigate('/characters/:id', { id: c.id }));
                    li.append(a);
                    return li;
                }),
                'Пока нет персонажей'
            )
        );

        // ---- Кампании
        sCamps.body.innerHTML = '';
        sCamps.body.append(
            list(
                (camps || []).map(c => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.href = 'javascript:void(0)';
                    a.textContent = c.name || `Кампания #${c.id}`;
                    a.addEventListener('click', () => navigate('/campaigns/:id', { id: c.id }));
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

        // ---- Журналы (по моим кампаниям, include=all), топ-10 последних
        const journalLists = await Promise.all(
            (camps || []).map(async camp => {
                try {
                    const arr = await api.get(`/api/campaigns/${camp.id}/journal?include=all`);
                    return (arr || []).map(e => ({ ...e, _campaign: camp }));
                } catch {
                    return [];
                }
            })
        );
        let journalItems = journalLists.flat();
        journalItems.sort((a, b) => {
            const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return db - da;
        });
        journalItems = journalItems.slice(0, 10);

        sJournals.body.innerHTML = '';
        sJournals.body.append(
            list(
                journalItems.map(j => {
                    const li = document.createElement('li');
                    const title = document.createElement('a');
                    title.href = 'javascript:void(0)';
                    title.textContent = `${j.title || '(без названия)'} — ${j.type || ''} — ${j.visibility || ''}`;
                    title.addEventListener('click', () => navigate('/campaigns/:id', { id: j._campaign.id }));
                    const cap = document.createElement('div');
                    cap.className = 'muted';
                    const when = j.createdAt ? new Date(j.createdAt).toLocaleString('ru-RU') : '';
                    cap.textContent = `${j._campaign.name || `Кампания #${j._campaign.id}`} • ${when}`;
                    li.append(title, cap);
                    return li;
                }),
                (camps && camps.length) ? 'Журналов пока нет' : 'Сначала создайте кампанию'
            )
        );
    } catch (e) {
        sChars.body.innerHTML = '<div class="error">Не удалось загрузить данные.</div>';
        sCamps.body.innerHTML = '<div class="error">Не удалось загрузить данные.</div>';
        sJournals.body.innerHTML = '<div class="error">Не удалось загрузить данные.</div>';
        toast(e?.message || 'Ошибка загрузки дашборда');
        console.error(e);
    }
}
