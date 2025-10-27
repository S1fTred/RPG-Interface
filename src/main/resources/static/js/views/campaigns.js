// src/main/resources/static/js/views/campaigns.js
import { mount } from '../app.js';
import { el, card, h1, h2, table, button, input, toast, setBusy, skeleton } from '../ui.js';
import { api } from '../api.js';
import { me } from '../auth.js';
import { navigate } from '../router.js';

export async function renderCampaigns(){
    const user = me();
    if (!user){ mount(card(h1('Требуется вход'))); return; }

    const page = el('div',{}, card(h1('Кампании'), el('div',{}, 'Загрузка...')));
    mount(page);

    async function load(){
        page.innerHTML = '';
        const shell = card(h1('Кампании'), el('div',{}, skeleton(3)));
        page.appendChild(shell);

        try{
            const gmCampaigns = await api.get('/api/campaigns');

            const nameIn = input({ placeholder:'Название новой кампании', required:'required' });
            const createBtn = button('Создать','btn primary');
            createBtn.addEventListener('click', async ()=>{
                const name = nameIn.value.trim();
                if (!name){ toast('Укажите название'); return; }
                setBusy(createBtn, true);
                try{
                    const created = await api.post('/api/campaigns', { name });
                    toast('Кампания создана');
                    navigate('/campaigns/:id', { id: created.id });
                }catch(err){
                    toast(err?.message || 'Ошибка создания кампании');
                }finally{
                    setBusy(createBtn, false);
                }
            });

            const rowsGM = (gmCampaigns || []).map(c => [
                el('strong',{}, c.name || `Кампания #${c.id}`),
                c.description || '',
                c.createdAt ? new Date(c.createdAt).toLocaleDateString('ru-RU') : '',
                button('Открыть','btn', ()=> navigate('/campaigns/:id', { id: c.id }))
            ]);

            page.innerHTML = '';
            page.appendChild(card(
                h1('Кампании'),
                el('div',{class:'row', style:'gap:.5rem;'}, [nameIn, createBtn])
            ));

            page.appendChild(
                card(
                    h2('Где я GM'),
                    rowsGM.length
                        ? table(['Название','Описание','Создана',''], rowsGM)
                        : el('div',{class:'empty'},'Нет кампаний')
                )
            );

        }catch(e){
            page.innerHTML = '';
            page.appendChild(card(
                h1('Ошибка'),
                el('div',{}, e?.message || 'Не удалось загрузить кампании')
            ));
        }
    }

    await load();
}
