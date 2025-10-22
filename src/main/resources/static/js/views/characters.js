import { mount } from '../app.js';
import { el, card, h1, table, button, toast } from '../ui.js';
import { api } from '../api.js';
import { me } from '../auth.js';
import { navigate } from '../router.js';

export async function renderCharacters(){
  const user = me();
  if (!user){ mount(card(h1('Требуется вход'))); return; }

  const page = el('div',{}, card(h1('Мои персонажи'), el('div',{},'Загрузка...')));
  mount(page);

  try{
    const res = await api.get(`/api/characters/by-owner-id/${user.id}`);
    if (!res.ok) throw await res.json();
    const chars = await res.json();
    const rows = (chars || []).map(c => [
      el('strong',{},c.name),
      c.clazz,
      c.race,
      `${c.level}`,
      `${c.hp}/${c.maxHp}`,
      button('Открыть','btn', ()=> navigate(`/character?id=${c.id}`))
    ]);
    const tbl = table(['Имя','Класс','Раса','Ур.','HP',''], rows);
    const actions = el('div',{class:'toolbar'}, [
      button('Создать персонажа','btn primary', ()=> toast('Создание персонажа выполняется внутри кампании (GM/Player). Откройте страницу кампании.'))
    ]);
    page.innerHTML='';
    page.appendChild(card(h1('Мои персонажи'), actions, tbl));
  }catch(e){
    page.innerHTML='';
    page.appendChild(card(h1('Ошибка'), el('pre',{class:'code'}, JSON.stringify(e,null,2))));
  }
}
