// src/main/resources/static/js/views/campaignDetail.js
import { mount } from '../app.js';
import { el, card, h1, h2, table, button, input, select, toast, setBusy, skeleton, confirmDanger } from '../ui.js';
import { api } from '../api.js';
import { me } from '../auth.js';
import { navigate } from '../router.js';

export async function renderCampaignDetail(id){
    if (!id){ mount(card(h1('Кампания не указана'))); return; }

    const user = me();
    const page = el('div',{}, card(h1('Загрузка…'), el('div',{}, skeleton(3))));
    mount(page);

    try{
        const camp = await api.get(`/api/campaigns/${id}`);

        const isGM = (camp.gmId === user?.id);
        const title = isGM ? `${camp.name} — панель GM` : (camp.name || `Кампания #${id}`);

        const [members, chars, journals] = await Promise.all([
            api.get(`/api/campaigns/${id}/members`).catch(()=>[]),
            api.get(`/api/campaigns/${id}/characters`).catch(()=>[]),
            api.get(`/api/campaigns/${id}/journal${isGM ? '?include=all':''}`).catch(()=>[])
        ]);

        page.innerHTML='';
        page.appendChild(card(
            h1(title),
            el('div',{}, camp.description || '')
        ));

        const memberRows = (members || []).map(m => [
            el('strong',{}, m.username || `User #${m.userId}`),
            m.email || '',
            m.roleInCampaign || '',
            isGM ? button('Удалить','btn danger', async (ev)=>{
                if(!confirmDanger('Удалить участника?')) return;
                const btn = ev.currentTarget; setBusy(btn,true);
                try{
                    await api.del(`/api/campaigns/${id}/members/${m.userId}`);
                    toast('Удалено');
                    await renderCampaignDetail(id);
                }catch(err){
                    toast(err?.message || 'Ошибка удаления');
                }finally{ setBusy(btn,false); }
            }) : ''
        ]);

        const memberCard = card(
            h2('Участники'),
            memberRows.length
                ? table(['Имя','Email','Роль',''], memberRows)
                : el('div',{class:'empty'},'Пока никого')
        );

        if (isGM){
            const userIdInput = input({ placeholder:'userId (UUID)', autocomplete:'off' });
            const roleSel = select({}, [
                {value:'PLAYER', label:'PLAYER', selected:true},
                {value:'GM', label:'GM'}
            ]);
            const addBtn = button('Добавить / Обновить','btn primary');
            addBtn.addEventListener('click', async ()=>{
                const uid = userIdInput.value.trim();
                if(!uid){ toast('Укажите userId'); return; }
                setBusy(addBtn,true);
                try{
                    await api.put(`/api/campaigns/${id}/members/${uid}`, { roleInCampaign: roleSel.value });
                    toast('Сохранено');
                    await renderCampaignDetail(id);
                }catch(err){
                    toast(err?.message || 'Ошибка сохранения');
                }finally{ setBusy(addBtn,false); }
            });

            memberCard.appendChild(el('hr'));
            memberCard.appendChild(el('div',{class:'toolbar'},[userIdInput, roleSel, addBtn]));
        }
        page.appendChild(memberCard);

        const charRows = (chars || []).map(c => [
            el('strong',{}, c.name || `#${c.id}`),
            c.clazz || '', c.race || '', String(c.level ?? ''),
            `${c.hp}/${c.maxHp}`,
            button('Открыть','btn', ()=> navigate('/characters/:id', { id: c.id }))
        ]);
        page.appendChild(
            card(
                h2('Персонажи'),
                charRows.length ? table(['Имя','Класс','Раса','Ур.','HP',''], charRows)
                    : el('div',{class:'empty'},'Нет персонажей')
            )
        );

        const sortedJ = (journals || []).slice().sort((a,b)=>{
            const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return db - da;
        });
        const jRows = sortedJ.map(j => [
            j.title || '(без названия)',
            j.type || '',
            j.visibility || '',
            j.createdAt ? new Date(j.createdAt).toLocaleString('ru-RU') : ''
        ]);
        page.appendChild(
            card(
                h2('Журнал'),
                jRows.length ? table(['Заголовок','Тип','Видимость','Создано'], jRows)
                    : el('div',{class:'empty'},'Записей нет')
            )
        );

    }catch(e){
        page.innerHTML='';
        page.appendChild(card(
            h1('Ошибка'),
            el('div',{}, e?.message || 'Не удалось загрузить кампанию')
        ));
    }
}
