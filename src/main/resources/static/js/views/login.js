import { mount } from '../app.js';
import { el, card, h1, input, button, toast } from '../ui.js';
import { login } from '../auth.js';
import { navigate } from '../router.js';

export function renderLogin(){
  const u = input({ placeholder:'username' });
  const p = input({ placeholder:'password', type:'password' });
  const submit = button('Войти','btn primary', async ()=>{
    submit.disabled = true;
    try{
      await login(u.value.trim(), p.value);
      toast('Успешный вход');
      navigate('/');
    }catch(err){
      toast((err && err.message) || 'Ошибка входа');
    }finally{ submit.disabled=false; }
  });

  const box = card(
    h1('Вход'),
    el('div',{}, [u]), el('div',{},[p]),
    el('div',{class:'toolbar'}, [submit, button('Регистрация','btn', ()=> navigate('/register'))])
  );
  mount(el('div',{}, box));
}
