// js/app.js — домашний экран: рендер кампаний и персонажей (без фреймворков)

import { me } from './auth.js';
import { api } from './api.js';

// ===== утилиты =====
const $ = (sel) => document.querySelector(sel);

function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
}

// ===== рендер списков =====
function renderCampaigns(listEl, items) {
    listEl.innerHTML = '';
    if (!items?.length) {
        listEl.textContent = 'Пока нет кампаний.';
        return;
    }
    items.forEach(c => {
        const row = el('div', 'row-item');
        const left = el('div');
        left.append(
            el('div', 'title', c.name || `Кампания #${c.id}`),
            el('div', 'muted', `ID: ${c.id}`)
        );
        row.append(left);
        listEl.append(row);
    });
}

function renderCharacters(listEl, items) {
    listEl.innerHTML = '';
    if (!items?.length) {
        listEl.textContent = 'Пока нет персонажей.';
        return;
    }
    items.forEach(ch => {
        const row = el('div', 'row-item');
        const left = el('div');
        left.append(
            el('div', 'title', `${ch.name} · ${ch.clazz} · ${ch.race}`),
            el('div', 'muted', `HP: ${ch.hp}/${ch.maxHp}`)
        );
        row.append(left);
        listEl.append(row);
    });
}

// ===== загрузка домашней =====
async function loadHome() {
    const listC = $('#home-campaigns-list');
    const listH = $('#home-characters-list');
    if (!listC || !listH) return;

    listC.textContent = 'Загрузка...';
    listH.textContent = 'Загрузка...';

    // Мои кампании (как GM)
    try {
        const campaigns = await api.get('/api/campaigns');
        renderCampaigns(listC, campaigns);
    } catch (e) {
        listC.textContent = 'Ошибка: ' + (e.message || 'не удалось получить кампании');
    }

    // Мои персонажи
    try {
        const u = me();
        if (!u?.id) throw new Error('Нет текущего пользователя');
        const chars = await api.get(`/api/characters/by-owner-id/${u.id}`);
        renderCharacters(listH, chars);
    } catch (e) {
        listH.textContent = 'Ошибка: ' + (e.message || 'не удалось получить персонажей');
    }
}

// ===== экспорт =====
export async function loadHomeData() {
    try {
        await loadHome();
    } catch (e) {
        console.error('Ошибка при загрузке данных домашней страницы:', e);
    }
}
