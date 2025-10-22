import { mount } from '../app.js';
import { el, card, h1, h2, kv, button, input, toast, table } from '../ui.js';
import { api } from '../api.js';

export async function renderCharacterDetail(id){
  if (!id){ mount(card(h1('Персонаж не указан'))); return; }
  const page = el('div',{}, card(h1('Загрузка персонажа...')));
  mount(page);

  try{
    const res = await api.get(`/api/characters/${id}`);
    if (!res.ok) throw await res.json();
    const c = await res.json();

    const hpInput = input({ type:'number', value: c.hp });
    const setBtn = button('Установить HP','btn', async ()=>{
      const v = parseInt(hpInput.value,10);
      const res = await api.patch(`/api/characters/${id}/hp?hp=${v}`);
      if (!res.ok){ toast('Ошибка'); return; }
      const upd = await res.json();
      hpInput.value = upd.hp;
      toast('HP обновлён');
    });

    const attrs = [
      ['STR', c.atributes?.attr_str], ['DEX', c.atributes?.attr_agi], ['CON', c.atributes?.attr_stam],
      ['INT', c.atributes?.attr_int], ['WIS', c.atributes?.attr_wis], ['CHA', c.atributes?.attr_cha],
    ];

    const invRes = await api.get(`/api/characters/${id}/inventory`);
    const inv = invRes.ok ? await invRes.json() : [];

    page.innerHTML='';
    page.appendChild(card(
      h1(c.name),
      el('div',{class:'row'},[
        el('div',{class:'col'},[
          h2('Основное'),
          kv('Класс', c.clazz || '-'),
          kv('Раса', c.race || '-'),
          kv('Уровень', String(c.level)),
          kv('HP', `${c.hp}/${c.maxHp}`),
          el('div',{class:'toolbar'}, [hpInput, setBtn])
        ]),
        el('div',{class:'col'},[
          h2('Атрибуты'),
          table(['Атрибут','Значение'], attrs.map(([n,v])=>[n, String(v ?? '-') ]))
        ])
      ])
    ));

    // Inventory
    const invRows = (inv || []).map(ci => [ci.itemName, ci.quantity, ci.itemDescription || '', ci.itemWeight || '', ci.itemPrice || '']);
    page.appendChild(card(
      h2('Инвентарь'),
      inv.length ? table(['Предмет','Кол-во','Описание','Вес','Цена'], invRows) : el('div',{class:'empty'},'Инвентарь пуст')
    ));
  }catch(e){
    page.innerHTML='';
    page.appendChild(card(h1('Ошибка'), el('pre',{class:'code'}, JSON.stringify(e,null,2))));
  }
}
