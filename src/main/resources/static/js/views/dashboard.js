import { mount } from '../app.js';
import { el, card, h1, h2, button } from '../ui.js';
import { me } from '../auth.js';
import { navigate } from '../router.js';

export function renderDashboard(){
  const u = me();
  if (!u){
    mount(card(h1('Добро пожаловать!'), el('p',{},'Пожалуйста, войдите или зарегистрируйтесь.')));
    return;
  }
  const panel = card(
    h1('Панель'),
    el('p',{}, `Привет, ${u.username}!`),
    el('div',{class:'toolbar'}, [
      button('Мои персонажи','btn primary', ()=> navigate('/characters')),
      button('Мои журналы','btn', ()=> navigate('/journals')),
      button('Кампании','btn', ()=> navigate('/campaigns'))
    ])
  );
  mount(el('div',{}, [panel]));
}
