// src/main/resources/static/js/views/items.js
import { mount } from '../app.js';
import { el, card, h1, h2, table, input, textarea, button, toast, setBusy, skeleton } from '../ui.js';
import { api } from '../api.js';
import { me } from '../auth.js';

export async function renderItems(){
    const user = me();
    const isAdmin = !!user && Array.isArray(user.roles) && user.roles.includes('ROLE_ADMIN');
    if (!isAdmin){
        mount(card(h1('Доступ запрещён')));
        return;
    }

    const page = el('div',{}, card(h1('Каталог предметов'), el('div',{},'Загрузка...')));
    mount(page);

    async function load(){
        page.innerHTML = '';
        const wrap = card(h1('Каталог предметов (ADMIN)'));
        wrap.appendChild(el('div',{}, skeleton(3)));
        page.appendChild(wrap);

        try{
            const items = await api.get('/api/items'); // ожидаем массив
            const rows = (items || []).map(i => [
                el('strong',{}, i.name),
                i.description || '',
                String(i.weight ?? ''),
                String(i.price ?? ''),
                el('div',{class:'toolbar'},[
                    button('Ред.','btn', ()=> edit(i)),
                    button('Удалить','btn danger', async (ev)=>{
                        const btn = ev.currentTarget;
                        if (!confirm('Удалить предмет?')) return;
                        setBusy(btn, true);
                        try{
                            await api.del(`/api/items/${i.id}`);
                            toast('Удалено');
                            await load();
                        }catch(err){
                            toast(err?.message || 'Ошибка удаления');
                        }finally{
                            setBusy(btn, false);
                        }
                    })
                ])
            ]);

            page.innerHTML = '';
            page.appendChild(card(
                h1('Каталог предметов (ADMIN)'),
                rows.length ? table(['Название','Описание','Вес','Цена',''], rows)
                    : el('div',{class:'empty'},'Пока пусто'),
                el('hr'),
                h2('Создать'),
                form() // форма создания
            ));
        }catch(e){
            page.innerHTML = '';
            page.appendChild(card(
                h1('Ошибка'),
                el('div',{}, e?.message || 'Не удалось загрузить предметы')
            ));
        }
    }

    function form(item = null){
        const name   = input({ placeholder:'Название', value: item?.name || '', required:'required' });
        const desc   = textarea({ placeholder:'Описание' }); desc.value = item?.description || '';
        const weight = input({ placeholder:'Вес', type:'number', value: item?.weight ?? '' });
        const price  = input({ placeholder:'Цена', type:'number', value: item?.price ?? '' });
        const submit = button(item ? 'Сохранить' : 'Создать','btn primary');

        async function onSubmit(){
            const body = {
                name: name.value.trim(),
                description: desc.value.trim(),
                weight: weight.value !== '' ? Number(weight.value) : null,
                price:  price.value  !== '' ? Number(price.value)  : null
            };
            if (!body.name){
                toast('Укажите название');
                return;
            }
            setBusy(submit, true);
            try{
                if (item) {
                    await api.patch(`/api/items/${item.id}`, body);
                } else {
                    await api.post('/api/items', body);
                }
                toast('Сохранено');
                await load();
            }catch(err){
                toast(err?.message || 'Ошибка сохранения');
            }finally{
                setBusy(submit, false);
            }
        }

        submit.addEventListener('click', onSubmit);

        return el('div',{class:'row'},[
            el('div',{class:'col', style:'flex:2; min-width:280px;'}, [name, desc]),
            el('div',{class:'col', style:'flex:1; min-width:220px;'}, [
                weight, price,
                el('div',{class:'toolbar'},[submit])
            ])
        ]);
    }

    function edit(item){
        page.innerHTML='';
        page.appendChild(card(
            h1('Редактирование предмета'),
            form(item),
            el('div',{class:'toolbar', style:'margin-top:.5rem;'},[
                button('Назад','btn', load)
            ])
        ));
    }

    await load();
}
