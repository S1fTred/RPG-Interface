// src/main/resources/static/js/views/journals.js
import { mount } from '../app.js';
import { el, card, h1, table, toast } from '../ui.js';
import { api } from '../api.js';
import { me } from '../auth.js';

export async function renderJournals(){
    const user = me();
    if (!user){
        mount(card(h1('Требуется вход')));
        return;
    }

    const page = el('div',{}, card(h1('Журналы'), el('div',{},'Загрузка...')));
    mount(page);

    try{
        // Мои кампании (как GM)
        const gmCampaigns = await api.get('/api/campaigns'); // массив кампаний

        // Параллельно тянем журналы для каждой кампании с include=all
        const lists = await Promise.all(
            (gmCampaigns || []).map(async camp => {
                try{
                    const items = await api.get(`/api/campaigns/${camp.id}/journal?include=all`);
                    // Возвращаем только мои записи (я — автор)
                    return (items || []).filter(e => e.authorId === user.id).map(e => ({ ...e, campaignId: camp.id }));
                }catch(_){
                    return []; // если одна кампания упала — не валим весь экран
                }
            })
        );

        // Объединяем всё и сортируем по дате создания (свежее сверху)
        const all = lists.flat().sort((a,b)=>{
            const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return db - da;
        });

        const rows = all.map(j => [
            j.title || '(без названия)',
            j.type || '',
            j.visibility || '',
            j.createdAt ? new Date(j.createdAt).toLocaleString('ru-RU') : '',
            j.campaignId ?? ''
        ]);

        page.innerHTML='';
        page.appendChild(
            card(
                h1('Мои журналы (как GM)'),
                rows.length
                    ? table(['Заголовок','Тип','Видимость','Создан','Кампания'], rows)
                    : el('div',{class:'empty'},'Нет записей')
            )
        );
    }catch(e){
        page.innerHTML='';
        page.appendChild(
            card(
                h1('Ошибка'),
                el('div',{}, (e && e.message) ? e.message : 'Не удалось загрузить журналы')
            )
        );
        toast((e && e.message) || 'Ошибка загрузки журналов');
    }
}
