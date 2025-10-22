import { mount } from '../app.js';
import { el, card, h1, input, button, toast } from '../ui.js';
import { register } from '../auth.js';
import { navigate } from '../router.js';

export function renderRegister(){
  const u = input({ placeholder:'username' });
  const e = input({ placeholder:'email', type:'email' });
  const p = input({ placeholder:'password', type:'password' });
  const submit = button('Зарегистрироваться','btn primary', async ()=>{
    submit.disabled = true;
    try{
      await register(u.value.trim(), e.value.trim(), p.value);
      toast('Готово! Вы вошли под новой учетной записью');
      navigate('/');
    }catch(err){
      toast((err && err.message) || 'Ошибка регистрации');
    }finally{ submit.disabled=false; }
  });

  const box = card(
    h1('Регистрация'),
    el('div',{}, [u]), el('div',{},[e]), el('div',{},[p]),
    el('div',{class:'toolbar'}, [submit, button('У меня уже есть аккаунт','btn', ()=> navigate('/login'))])
  );
  mount(el('div',{}, box));
}
