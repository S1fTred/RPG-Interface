import { mount } from '../app.js';
import { el, card, h1, h2, input, select, button, table, toast } from '../ui.js';
import { api } from '../api.js';
import { me } from '../auth.js';

export async function renderJournals(){
  const user = me();
  if (!user){ mount(card(h1('Требуется вход'))); return; }
  const page = el('div',{}, card(h1('Журналы'), el('div',{},'Загрузка...')));
  mount(page);

  try{
    // Стратегия: собрать журналы из кампаний, где пользователь GM (include=all),
    // и отфильтровать по authorId = текущий пользователь — это "мои журналы".
    const gmRes = await api.get('/api/campaigns'); // мои кампании как GM
    const gmCampaigns = gmRes.ok ? await gmRes.json() : [];
    let all = [];
    for (const camp of gmCampaigns){
      const r = await api.get(`/api/campaigns/${camp.id}/journal?include=all`);
      if (r.ok){
        const list = await r.json();
        all.push(...list.filter(e => e.authorId === user.id));
      }
    }
    // Простейший список
    const rows = all.map(j => [
      j.title || '(без названия)',
      j.type,
      j.visibility,
      new Date(j.createdAt).toLocaleString(),
      j.campaignId
    ]);
    page.innerHTML='';
    page.appendChild(card(h1('Мои журналы (как GM)'), rows.length ? table(['Заголовок','Тип','Видимость','Создан','Кампания'], rows) : el('div',{class:'empty'},'Нет записей')));
  }catch(e){
    page.innerHTML='';
    page.appendChild(card(h1('Ошибка'), el('pre',{class:'code'}, JSON.stringify(e,null,2))));
  }
}
