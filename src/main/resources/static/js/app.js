import { route, setNotFound, dispatch, navigate } from './router.js';
import { boot, me, signout } from './auth.js';
import { renderLogin } from './views/login.js';
import { renderRegister } from './views/register.js';
import { renderDashboard } from './views/dashboard.js';
import { renderCharacters } from './views/characters.js';
import { renderCharacterDetail } from './views/characterDetail.js';
import { renderJournals } from './views/journals.js';
import { renderCampaigns } from './views/campaigns.js';
import { renderCampaignDetail } from './views/campaignDetail.js';
import { renderItems } from './views/items.js';

const app = document.getElementById('app');
const nav = document.getElementById('top-nav');

function link(path, text){
  const a = document.createElement('button');
  a.className = 'nav-btn';
  a.textContent = text;
  a.addEventListener('click', () => navigate(path));
  if (location.hash.slice(1).split('?')[0] === path) a.setAttribute('aria-current','page');
  return a;
}

function layout(){
  nav.innerHTML = '';
  const u = me();
  if (!u){
    nav.append(link('/login','Войти'), link('/register','Регистрация'));
    return;
  }
  nav.append(
    link('/','Главная'),
    link('/characters','Персонажи'),
    link('/journals','Журналы'),
    link('/campaigns','Кампании'),
  );
  if (u.roles?.includes('ADMIN')) nav.append(link('/items','Предметы'));
  // user menu
  const meBtn = document.createElement('button');
  meBtn.className='nav-btn';
  meBtn.textContent = `↪︎ Выйти (${u.username})`;
  meBtn.addEventListener('click', ()=> { signout(); navigate('/login'); });
  nav.append(meBtn);
}

export function mount(view){
  app.innerHTML='';
  app.appendChild(view);
  layout();
}

// Routes
route('/', () => renderDashboard());
route('/login', () => renderLogin());
route('/register', () => renderRegister());
route('/characters', () => renderCharacters());
route('/character', ({params}) => renderCharacterDetail(params.id));
route('/journals', () => renderJournals());
route('/campaigns', () => renderCampaigns());
route('/campaign', ({params}) => renderCampaignDetail(params.id));
route('/items', () => renderItems());

setNotFound(() => mount(document.createTextNode('Страница не найдена')));

await boot();
layout();
dispatch();
