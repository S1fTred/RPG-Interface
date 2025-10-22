import { mount } from '../app.js';
import { el, card, h1, h2, table, button, input, select, toast } from '../ui.js';
import { api } from '../api.js';
import { me } from '../auth.js';

export async function renderCampaignDetail(id){
  if (!id){ mount(card(h1('Кампания не указана'))); return; }
  const user = me();
  const page = el('div',{}, card(h1('Загрузка...')));
  mount(page);

  try{
    const campRes = await api.get(`/api/campaigns/${id}`);
    if (!campRes.ok) throw await campRes.json();
    const camp = await campRes.json();

    // Members
    const memRes = await api.get(`/api/campaigns/${id}/members`);
    const members = memRes.ok ? await memRes.json() : [];

    // Characters
    const charsRes = await api.get(`/api/campaigns/${id}/characters`);
    const chars = charsRes.ok ? await charsRes.json() : [];

    // Journal (GM view -> include=all; else players-only)
    const include = (camp.gmId === user?.id) ? 'all' : '';
    const jRes = await api.get(`/api/campaigns/${id}/journal${include ? '?include=all':''}`);
    const journals = jRes.ok ? await jRes.json() : [];

    // UI
    const isGM = (camp.gmId === user?.id);
    const title = isGM ? `${camp.name} — панель GM` : camp.name;

    page.innerHTML='';
    page.appendChild(card(h1(title), el('div',{}, camp.description || '')));

    // Members table
    const memberRows = members.map(m => [
      el('strong',{}, m.username),
      m.email || '',
      m.roleInCampaign,
      isGM ? button('Удалить','btn danger', async ()=>{
        const r = await api.del(`/api/campaigns/${id}/members/${m.userId}`);
        if (r.ok){ toast('Удалено'); renderCampaignDetail(id); }
        else toast('Ошибка удаления');
      }) : ''
    ]);
    const memberCard = card(
      h2('Участники'),
      memberRows.length ? table(['Имя','Email','Роль',''], memberRows) : el('div',{class:'empty'},'Пока никого'),
    );

    // GM-only: add/update member with PUT
    if (isGM){
      const userIdInput = input({ placeholder:'userId UUID' });
      const roleSel = select({}, [
        {value:'PLAYER', label:'PLAYER', selected:true},
        {value:'GM', label:'GM'}
      ]);
      const addBtn = button('Добавить / Обновить','btn primary', async ()=>{
        const body = { roleInCampaign: roleSel.value };
        const r = await api.put(`/api/campaigns/${id}/members/${userIdInput.value.trim()}`, body);
        if (r.ok || r.status === 201){ toast('Сохранено'); renderCampaignDetail(id); }
        else toast('Ошибка');
      });
      memberCard.appendChild(el('hr'));
      memberCard.appendChild(el('div',{class:'toolbar'},[userIdInput, roleSel, addBtn]));
    }
    page.appendChild(memberCard);

    // Characters table
    const charRows = chars.map(c => [
      el('strong',{},c.name),
      c.clazz, c.race, String(c.level),
      `${c.hp}/${c.maxHp}`,
      button('Открыть','btn', ()=> location.hash = `/character?id=${c.id}`)
    ]);
    page.appendChild(card(h2('Персонажи'), charRows.length ? table(['Имя','Класс','Раса','Ур.','HP',''], charRows) : el('div',{class:'empty'},'Нет персонажей')));

    // Journal table
    const jRows = journals.map(j => [
      j.title || '(без названия)',
      j.type,
      j.visibility,
      new Date(j.createdAt).toLocaleString()
    ]);
    page.appendChild(card(h2('Журнал'), jRows.length ? table(['Заголовок','Тип','Видимость','Создано'], jRows) : el('div',{class:'empty'},'Записей нет')));

  }catch(e){
    page.innerHTML='';
    page.appendChild(card(h1('Ошибка'), el('pre',{class:'code'}, JSON.stringify(e,null,2))));
  }
}
