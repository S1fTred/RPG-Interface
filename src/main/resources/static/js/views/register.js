// static/js/views/register.js
import { mount } from '../app.js';
import { el, card, h1, input, button, toast, setBusy } from '../ui.js';
import { register } from '../auth.js';
import { navigate } from '../router.js';

export function renderRegister(){
    const username = input({ placeholder:'Имя пользователя', name:'username', required:'required', autocomplete:'username' });
    const email    = input({ placeholder:'Email', type:'email', name:'email', required:'required', autocomplete:'email' });
    const password = input({ placeholder:'Пароль', type:'password', name:'password', required:'required', autocomplete:'new-password' });

    const submit = button('Зарегистрироваться','btn primary');
    const toLogin = button('У меня уже есть аккаунт','btn', ()=> navigate('/login'));

    const form = el('form', { class:'stack small', onsubmit: async (ev)=>{
            ev.preventDefault();
            const u = username.value.trim();
            const e = email.value.trim();
            const p = password.value;
            if(!u || !e || !p){ toast('Заполните все поля'); return; }

            setBusy(submit, true);
            try{
                await register(u, e, p);
                toast('Готово! Вы вошли под новой учетной записью');
                navigate('/');
            }catch(err){
                toast((err && err.message) || 'Ошибка регистрации');
            }finally{
                setBusy(submit, false);
            }
        }}, [
        username,
        email,
        password,
        el('div', { class:'toolbar' }, [submit, toLogin])
    ]);

    const box = card(h1('Регистрация'), form);
    mount(el('div',{}, box));
    setTimeout(()=> username.focus(), 0);
}
