// src/main/resources/static/js/views/character.js
import { mount } from '../app.js';
import { el, card, h1, table, button, toast, skeleton } from '../ui.js';
import { api } from '../api.js';
import { me } from '../auth.js';
import { navigate } from '../router.js';

export async function renderCharacters(){
    const user = me();
    if (!user){
        mount(card(h1('Требуется вход')));
        return;
    }

    const page = el('div',{}, card(h1('Мои персонажи'), el('div',{}, 'Загрузка...')));
    mount(page);

    try{
        // скелетон
        page.innerHTML = '';
        const shell = card(h1('Мои персонажи'), el('div',{}, skeleton(3)));
        page.appendChild(shell);

        const chars = await api.get(`/api/characters/by-owner-id/${user.id}`); // массив

        const rows = (chars || []).map(c => [
            el('strong',{}, c.name),
            c.clazz,
            c.race,
            String(c.level ?? ''),
            `${c.hp}/${c.maxHp}`,
            button('Открыть','btn', ()=> navigate('/characters/:id', { id: c.id }))
        ]);

        const tbl = rows.length
            ? table(['Имя','Класс','Раса','Ур.','HP',''], rows)
            : el('div',{class:'empty'},'Пока нет персонажей');

        const actions = el('div',{class:'toolbar'}, [
            button('Создать персонажа','btn primary', ()=>
                toast('Создание персонажа выполняется внутри кампании. Откройте нужную кампанию.')
            )
        ]);

        page.innerHTML = '';
        page.appendChild(card(h1('Мои персонажи'), actions, tbl));

    }catch(e){
        page.innerHTML = '';
        page.appendChild(card(
            h1('Ошибка'),
            el('div',{}, e?.message || 'Не удалось загрузить персонажей')
        ));
        toast(e?.message || 'Ошибка загрузки персонажей');
    }
}
