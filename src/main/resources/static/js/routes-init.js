// js/routes-init.js — маршруты + welcome по умолчанию + надёжные кнопки в шапке

import { route, setNotFound, setBeforeEach, dispatch, navigate } from '/js/router.js';
import { me, boot, signout } from '/js/auth.js';

// Views
import { renderWelcome }          from '/js/views/welcome.js';
import { renderLogin }            from '/js/views/login.js';
import { renderRegister }         from '/js/views/register.js';
import { renderDashboard }        from '/js/views/dashboard.js';
import { renderCharacters }       from '/js/views/character.js';
import { renderCharacterDetail }  from '/js/views/characterDetail.js';
import { renderCampaigns }        from '/js/views/campaigns.js';
import { renderCampaignDetail }   from '/js/views/campaignDetail.js';
import { renderJournals }         from '/js/views/journals.js';
import { renderItems }            from '/js/views/items.js';

function syncNav() {
    const logged = !!me();
    document.getElementById('btnLoginNav')?.classList.toggle('hidden', logged);
    document.getElementById('btnRegisterNav')?.classList.toggle('hidden', logged);
    document.getElementById('btnLogoutNav')?.classList.toggle('hidden', !logged);
}

// Привяжем кнопки в шапке ОДИН раз и сделаем «двойной запуск» (navigate + прямой рендер)
(function bindHeaderNavOnce(){
    const btnLogin = document.getElementById('btnLoginNav');
    const btnReg   = document.getElementById('btnRegisterNav');
    const btnOut   = document.getElementById('btnLogoutNav');

    if (btnLogin && !btnLogin._bound) {
        btnLogin._bound = true;
        btnLogin.addEventListener('click', (e) => {
            e.preventDefault();
            // 1) стандартная навигация через роутер
            navigate('/login');
            // 2) запасной прямой рендер — вдруг hashchange/dispatch не сработал
            try { renderLogin(); } catch {}
        });
    }
    if (btnReg && !btnReg._bound) {
        btnReg._bound = true;
        btnReg.addEventListener('click', (e) => {
            e.preventDefault();
            navigate('/register');
            try { renderRegister(); } catch {}
        });
    }
    if (btnOut && !btnOut._bound) {
        btnOut._bound = true;
        btnOut.addEventListener('click', (e) => {
            e.preventDefault();
            signout();
            navigate('/');
            try { renderWelcome(); } catch {}
        });
    }
})();

// Гард приватных страниц
setBeforeEach(({ path }) => {
    syncNav();
    const logged = !!me();
    const isPublic = path === '/' || path === '/login' || path === '/register';
    if (!logged && !isPublic) {
        navigate('/login');
        try { renderLogin(); } catch {}
        return false;
    }
    return true;
});

// Главная: гостю — Welcome, вошедшему — Dashboard
route('/', () => (me() ? renderDashboard() : renderWelcome()));
// Публичные
route('/login',    renderLogin);
route('/register', renderRegister);
// Приватные
route('/characters',          renderCharacters);
route('/characters/:id',      ({ params }) => renderCharacterDetail(params.id));
route('/campaigns',           renderCampaigns);
route('/campaigns/:id',       ({ params }) => renderCampaignDetail(params.id));
route('/journals',            renderJournals);
route('/items',               renderItems);

// 404 → на главную
setNotFound(() => navigate('/'));

// События аутентификации
window.addEventListener('auth:login',  () => { syncNav(); navigate('/'); try{ renderDashboard(); }catch{} });
window.addEventListener('auth:logout', () => { syncNav(); navigate('/'); try{ renderWelcome();   }catch{} });

// Старт: сразу показать что-то полезное ещё до hash/dispatch
(async () => {
    // моментальный «optimistic» рендер на корне
    if (!location.hash || location.hash === '#/' || location.hash === '#') {
        me() ? renderDashboard() : renderWelcome();
    }
    await boot();     // silent refresh
    syncNav();
    // если hash пуст — проставим '/', чтобы роутер отработал единообразно
    if (!location.hash) location.hash = '/';
    dispatch();
})();
