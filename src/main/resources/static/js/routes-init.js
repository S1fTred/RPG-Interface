// js/routes-init.js — регистрация маршрутов и старт роутера

import { route, setNotFound, setBeforeEach, dispatch, navigate } from '/js/router.js';
import { me, boot, signout } from '/js/auth.js';

// Views
import { renderLogin }            from '/js/views/login.js';
import { renderRegister }         from '/js/views/register.js';
import { renderDashboard }        from '/js/views/dashboard.js';
import { renderCharacters }       from '/js/views/character.js';
import { renderCharacterDetail }  from '/js/views/characterDetail.js';
import { renderCampaigns }        from '/js/views/campaigns.js';
import { renderCampaignDetail }   from '/js/views/campaignDetail.js';
import { renderJournals }         from '/js/views/journals.js';
import { renderItems }            from '/js/views/items.js';

// Глобальный гард: закрываем приватные страницы для гостей
setBeforeEach(({ path }) => {
    const logged = !!me();
    const pub = path === '/' || path === '/login' || path === '/register';
    if (!logged && !pub) { navigate('/login'); return false; }

    // Обновим видимость кнопок в шапке
    const btnLogin = document.getElementById('btnLoginNav');
    const btnReg   = document.getElementById('btnRegisterNav');
    const btnOut   = document.getElementById('btnLogoutNav');
    btnLogin?.classList.toggle('hidden', logged);
    btnReg?.classList.toggle('hidden', logged);
    btnOut?.classList.toggle('hidden', !logged);
    return true;
});

// Обработчик выхода
const btnOut = document.getElementById('btnLogoutNav');
btnOut?.addEventListener('click', () => {
    signout();
    navigate('/login');
});

// Публичные
route('/',        renderDashboard);
route('/login',   renderLogin);
route('/register',renderRegister);

// Приватные
route('/characters',          renderCharacters);
route('/characters/:id',      ({ params }) => renderCharacterDetail(params.id));
route('/campaigns',           renderCampaigns);
route('/campaigns/:id',       ({ params }) => renderCampaignDetail(params.id));
route('/journals',            renderJournals);
route('/items',               renderItems);

// 404 → дашборд/домой
setNotFound(() => renderDashboard());

// Восстанавливаем сессию и стартуем роутер
(async () => {
    await boot();
    dispatch();
})();
