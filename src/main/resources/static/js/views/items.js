import { mount } from '../app.js';
import { el, card, h1, h2, table, input, textarea, button, toast } from '../ui.js';
import { api } from '../api.js';
import { me } from '../auth.js';

export async function renderItems(){
  const user = me();
  if (!user || !(user.roles||[]).includes('ADMIN')){
    mount(card(h1('Доступ запрещён')));
    return;
  }
  const page = el('div',{}, card(h1('Каталог предметов'), el('div',{},'Загрузка...')));
  mount(page);

  async function load(){
    const res = await api.get('/api/items?query=');
    const items = res.ok ? await res.json() : [];
    const rows = items.map(i => [
      el('strong',{},i.name),
      i.description || '',
      String(i.weight ?? ''),
      String(i.price ?? ''),
      el('div',{class:'toolbar'},[
        button('Ред.','btn', ()=> edit(i)),
        button('Удалить','btn danger', async ()=>{
          const r = await api.del(`/api/items/${i.id}`);
          if (r.ok){ toast('Удалено'); load(); }
          else toast('Ошибка удаления');
        })
      ])
    ]);
    page.innerHTML='';
    page.appendChild(card(
      h1('Каталог предметов (ADMIN)'),
      table(['Название','Описание','Вес','Цена',''], rows),
      el('hr'), h2('Создать'),
      form()
    ));
  }

  function form(item=null){
    const name = input({ placeholder:'Название', value: item?.name || '' });
    const desc = textarea({ placeholder:'Описание' }); desc.value = item?.description || '';
    const weight = input({ placeholder:'Вес', type:'number', value: item?.weight ?? '' });
    const price = input({ placeholder:'Цена', type:'number', value: item?.price ?? '' });
    const submit = button(item ? 'Сохранить' : 'Создать','btn primary', async ()=>{
      const body = {
        name: name.value.trim(), description: desc.value.trim(),
        weight: weight.value ? Number(weight.value) : null,
        price: price.value ? Number(price.value) : null
      };
      const r = item
        ? await api.patch(`/api/items/${item.id}`, body)
        : await api.post('/api/items', body);
      if (r.ok || r.status===201){ toast('Сохранено'); load(); }
      else toast('Ошибка');
    });
    return el('div',{class:'row'},[
      el('div',{class:'col'},[name, desc]),
      el('div',{class:'col'},[weight, price, el('div',{class:'toolbar'},[submit])])
    ]);
  }

  function edit(item){
    page.innerHTML='';
    page.appendChild(card(h1('Редактирование предмета'), form(item), button('Назад','btn', load)));
  }

  await load();
}
