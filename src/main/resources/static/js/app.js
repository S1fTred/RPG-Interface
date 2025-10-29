// js/app.js — минимальная логика домашней страницы (без роутера)

import { api } from './api.js';
import { me } from './auth.js';

const $ = (sel) => document.querySelector(sel);

function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
}

function renderCampaigns(listEl, items) {
    listEl.innerHTML = '';
    if (!items?.length) { listEl.textContent = 'Пока нет кампаний.'; return; }
    items.forEach(c => {
        const row = el('div', 'row-item');
        row.append(
            el('div', 'title', c.name || '(без названия)'),
            el('div', 'muted', `ID: ${c.id}`)
        );
        listEl.append(row);
    });
}

function renderCharacters(listEl, items) {
    listEl.innerHTML = '';
    if (!items?.length) { listEl.textContent = 'Пока нет персонажей.'; return; }
    items.forEach(ch => {
        const row = el('div', 'row-item');
        row.append(
            el('div', 'title', `${ch.name} · ${ch.clazz || '-'} · ${ch.race || '-'}`),
            el('div', 'muted', `HP: ${ch.hp}/${ch.maxHp}`)
        );
        listEl.append(row);
    });
}

function prettyServerError(msg) {
    const s = String(msg || '');
    if (s.toLowerCase().includes('internal server error') || s.trim().startsWith('<')) {
        return 'Ошибка сервера (500). Попробуйте позже.';
    }
    return s;
}

export async function loadHomeData() {
    const listC = $('#home-campaigns-list');
    const listH = $('#home-characters-list');
    if (!listC || !listH) return;

    listC.textContent = 'Загрузка...';
    listH.textContent = 'Загрузка...';

    // --- кампании (как GM)
    try {
        const campaigns = await api.get('/api/campaigns');
        renderCampaigns(listC, campaigns);
    } catch (e) {
        listC.textContent = 'Ошибка: ' + prettyServerError(e.message);
    }

    // --- персонажи пользователя
    try {
        const u = me();
        if (!u?.id) {
            listH.textContent = 'Нет данных профиля — обновите страницу или войдите заново.';
            return;
        }
        const chars = await api.get(`/api/characters/by-owner-id/${u.id}`);
        renderCharacters(listH, chars);
    } catch (e) {
        listH.textContent = 'Ошибка: ' + prettyServerError(e.message);
    }
}
