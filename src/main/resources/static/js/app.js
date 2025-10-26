// js/app.js — простой SPA без фреймворков: секции/формы/данные

import { boot, me, login, register, signout } from './auth.js';
import { api, readError } from './api.js';

// ===== утилиты показа/скрытия =====
const $ = (sel) => document.querySelector(sel);
function show(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    $(id)?.classList.remove('hidden');
}

// ===== рендер списков =====
function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
}

function renderCampaigns(listEl, items) {
    listEl.innerHTML = '';
    if (!items?.length) {
        listEl.textContent = 'Пока нет кампаний.';
        return;
    }
    items.forEach(c => {
        const row = el('div', 'row-item');
        row.append(
            el('div', 'title', c.name),
            el('div', 'muted', `ID: ${c.id}`)
        );
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
        row.append(
            el('div', 'title', `${ch.name} · ${ch.clazz} · ${ch.race}`),
            el('div', 'muted', `HP: ${ch.hp}/${ch.maxHp}`)
        );
        listEl.append(row);
    });
}

// ===== загрузка домашней =====
async function loadHome() {
    const listC = $('#home-campaigns-list');
    const listH = $('#home-characters-list');
    listC.textContent = 'Загрузка...';
    listH.textContent = 'Загрузка...';

    try {
        // Мои кампании (как GM)
        const cRes = await api.get('/api/campaigns');
        if (!cRes.ok) throw new Error(await readError(cRes));
        const campaigns = await cRes.json();
        renderCampaigns(listC, campaigns);
    } catch (e) {
        listC.textContent = 'Ошибка: ' + (e.message || 'не удалось получить кампании');
    }

    try {
        // Мои персонажи
        const u = me();
        const hRes = await api.get(`/api/characters/by-owner-id/${u.id}`);
        if (!hRes.ok) throw new Error(await readError(hRes));
        const chars = await hRes.json();
        renderCharacters(listH, chars);
    } catch (e) {
        listH.textContent = 'Ошибка: ' + (e.message || 'не удалось получить персонажей');
    }
}

// ===== экспортируем loadHomeData для index.html =====
export async function loadHomeData() {
    try {
        await loadHome();
    } catch (e) {
        console.error('Ошибка при загрузке данных домашней страницы:', e);
    }
}

// ===== инициализация обработчиков форм =====
function initForms() {
    // Вход
    const loginBtn = $('#loginSubmit');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const errBox = $('#loginError');
            errBox.classList.add('hidden');
            errBox.textContent = '';
            const u = $('#loginUsername').value.trim();
            const p = $('#loginPassword').value;
            loginBtn.disabled = true;
            try {
                await login(u, p);
                show('#view-home');
                await loadHome();
            } catch (e) {
                errBox.textContent = e.message || 'Ошибка входа';
                errBox.classList.remove('hidden');
            } finally {
                loginBtn.disabled = false;
            }
        });
    }

    // Регистрация
    const regBtn = $('#registerSubmit');
    const goLogin = $('#goLoginFromRegister');
    if (regBtn) {
        regBtn.addEventListener('click', async () => {
            const errBox = $('#registerError');
            errBox.classList.add('hidden');
            errBox.textContent = '';
            const u = $('#regUsername').value.trim();
            const em = $('#regEmail').value.trim();
            const p = $('#regPassword').value;
            regBtn.disabled = true;
            try {
                await register(u, em, p);
                show('#view-home');
                await loadHome();
            } catch (e) {
                errBox.textContent = e.message || 'Ошибка регистрации';
                errBox.classList.remove('hidden');
            } finally {
                regBtn.disabled = false;
            }
        });
    }

    if (goLogin) {
        goLogin.addEventListener('click', () => {
            show('#view-login');
        });
    }

    // Выход
    const logoutBtn = $('#logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signout();
            $('#home-campaigns-list').textContent = 'Загрузка...';
            $('#home-characters-list').textContent = 'Загрузка...';
            show('#view-login');
        });
    }
}

// ===== реакция на события auth =====
window.addEventListener('auth:login', async () => {
    show('#view-home');
    await loadHome();
});
window.addEventListener('auth:logout', () => {
    show('#view-login');
});

// ===== старт =====
await boot();

initForms();

// Показ первого экрана
if (me()) {
    show('#view-home');
    await loadHome();
} else {
    show('#view-welcome');
}
