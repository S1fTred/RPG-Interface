// src/main/resources/static/js/views/characterDetail.js
import { mount } from '../app.js';
import { el, card, h1, h2, kv, button, input, toast, table, setBusy, skeleton } from '../ui.js';
import { api } from '../api.js';
import { navigate } from '../router.js';

export async function renderCharacterDetail(id){
    if (!id){
        mount(card(h1('Персонаж не указан')));
        return;
    }

    const page = el('div',{}, card(h1('Загрузка персонажа…'), el('div',{}, skeleton(2))));
    mount(page);

    try{
        const c = await api.get(`/api/characters/${id}`);

        // ====== HP controls (set / delta) ======
        const hpSetInput = input({ type:'number', value: String(c.hp ?? 0), placeholder:'Set HP' });
        const hpDeltaInput = input({ type:'number', placeholder:'Δ HP (например, -3)' });

        const applyHpBtn = button('Применить HP','btn primary', async (ev)=>{
            const btn = ev.currentTarget;
            const body = {};
            if (hpSetInput.value !== '') body.set = Number(hpSetInput.value);
            if (hpDeltaInput.value !== '') body.delta = Number(hpDeltaInput.value);
            if (Object.keys(body).length === 0){ toast('Укажите set или delta'); return; }
            setBusy(btn, true);
            try{
                const upd = await api.patch(`/api/characters/${id}/hp`, body);
                hpSetInput.value = String(upd.hp);
                toast('HP обновлён');
                // Обновим краткую сводку
                hpSummary.textContent = `${upd.hp}/${upd.maxHp}`;
            }catch(err){
                toast(err?.message || 'Ошибка обновления HP');
            }finally{
                setBusy(btn, false);
            }
        });

        // ====== Attributes table (по нашему DTO) ======
        const A = c.attributes || {};
        const attrsRows = [
            ['STR', A.strength], ['DEX', A.dexterity], ['CON', A.constitution],
            ['INT', A.intelligence], ['WIS', A.wisdom], ['CHA', A.charisma],
        ].map(([n,v]) => [n, String(v ?? '-')]);

        // ====== Partial update form ======
        const nameIn   = input({ placeholder:'Имя', value: c.name || '' });
        const classIn  = input({ placeholder:'Класс', value: c.clazz || '' });
        const raceIn   = input({ placeholder:'Раса', value: c.race || '' });
        const levelIn  = input({ placeholder:'Уровень', type:'number', value: c.level ?? '' });
        const maxHpIn  = input({ placeholder:'Макс. HP', type:'number', value: c.maxHp ?? '' });
        const saveBtn  = button('Сохранить','btn');

        saveBtn.addEventListener('click', async ()=>{
            const patch = {};
            if (nameIn.value.trim() !== '' && nameIn.value.trim() !== c.name) patch.name = nameIn.value.trim();
            if (classIn.value.trim() !== '' && classIn.value.trim() !== c.clazz) patch.clazz = classIn.value.trim();
            if (raceIn.value.trim()  !== '' && raceIn.value.trim()  !== c.race)  patch.race  = raceIn.value.trim();
            if (levelIn.value !== '' && Number(levelIn.value) !== c.level)       patch.level = Number(levelIn.value);
            if (maxHpIn.value !== '' && Number(maxHpIn.value) !== c.maxHp)       patch.maxHp = Number(maxHpIn.value);

            if (Object.keys(patch).length === 0){ toast('Нет изменений'); return; }
            setBusy(saveBtn, true);
            try{
                await api.patch(`/api/characters/${id}`, patch);
                toast('Сохранено');
                // Перезагрузим экран целиком, чтобы все данные обновились
                renderCharacterDetail(id);
            }catch(err){
                toast(err?.message || 'Ошибка сохранения');
            }finally{
                setBusy(saveBtn, false);
            }
        });

        // ====== Inventory (мягкая загрузка) ======
        let inv = [];
        try{
            inv = await api.get(`/api/characters/${id}/inventory`);
        }catch{ inv = []; /* если API ещё нет — просто пусто */ }

        const invRows = (inv || []).map(ci => [
            ci.itemName,
            String(ci.quantity ?? ''),
            ci.itemDescription || '',
            String(ci.itemWeight ?? ''),
            String(ci.itemPrice ?? '')
        ]);

        // ====== Render ======
        const hpSummary = el('span', {}, `${c.hp}/${c.maxHp}`);

        page.innerHTML = '';
        page.appendChild(card(
            h1(c.name || `Персонаж #${id}`),
            el('div',{class:'row'},[
                el('div',{class:'col', style:'flex:1; min-width:260px;'},[
                    h2('Основное'),
                    kv('Класс', c.clazz || '-'),
                    kv('Раса',  c.race  || '-'),
                    kv('Уровень', String(c.level ?? '-')),
                    kv('HP', hpSummary),
                    el('div',{class:'toolbar'}, [
                        hpSetInput,
                        hpDeltaInput,
                        applyHpBtn
                    ])
                ]),
                el('div',{class:'col', style:'flex:1; min-width:260px;'},[
                    h2('Атрибуты'),
                    table(['Атрибут','Значение'], attrsRows)
                ])
            ])
        ));

        page.appendChild(card(
            h2('Инвентарь'),
            (inv && inv.length)
                ? table(['Предмет','Кол-во','Описание','Вес','Цена'], invRows)
                : el('div',{class:'empty'},'Инвентарь пуст')
        ));

        page.appendChild(card(
            h2('Редактировать'),
            el('div',{class:'row'},[
                el('div',{class:'col', style:'flex:2; min-width:260px;'}, [nameIn, classIn, raceIn]),
                el('div',{class:'col', style:'flex:1; min-width:220px;'}, [levelIn, maxHpIn, el('div',{class:'toolbar'},[saveBtn])])
            ]),
            el('div',{class:'toolbar', style:'margin-top:.5rem;'},[
                button('← К списку персонажей','btn', ()=> navigate('/characters'))
            ])
        ));

    }catch(e){
        page.innerHTML = '';
        page.appendChild(card(
            h1('Ошибка'),
            el('div',{}, e?.message || 'Не удалось загрузить персонажа')
        ));
    }
}
