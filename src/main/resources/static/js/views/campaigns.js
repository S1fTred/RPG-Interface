import { mount } from '../app.js';
import { el, card, h1, h2, table, button } from '../ui.js';
import { api } from '../api.js';
import { me } from '../auth.js';
import { navigate } from '../router.js';

export async function renderCampaigns(){
  const user = me();
  if (!user){ mount(card(h1('Требуется вход'))); return; }

  const page = el('div',{}, card(h1('Кампании'), el('div',{},'Загрузка...')));
  mount(page);

  try{
    const gmRes = await api.get('/api/campaigns'); // кампании где я GM
    const gmCampaigns = gmRes.ok ? await gmRes.json() : [];

    const rowsGM = gmCampaigns.map(c => [
      el('strong',{},c.name),
      c.description || '',
      c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
      button('Открыть','btn', ()=> navigate(`/campaign?id=${c.id}`))
    ]);

    page.innerHTML='';
    page.appendChild(card(h1('Кампании')),);
    page.appendChild(card(h2('Где я GM'), rowsGM.length ? table(['Название','Описание','Создана',''], rowsGM) : el('div',{class:'empty'},'Нет кампаний')));

    // TODO: список кампаний, где я игрок — при отсутствии прямого API можно будет построить,
    // когда CharacterDto будет возвращать campaignId, либо добавить API в бэке.
  }catch(e){
    page.innerHTML='';
    page.appendChild(card(h1('Ошибка'), el('pre',{class:'code'}, JSON.stringify(e,null,2))));
  }
}
