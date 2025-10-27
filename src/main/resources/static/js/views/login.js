// src/main/resources/static/js/views/login.js
import { mount } from '../app.js';
import { el, card, h1, input, button, toast, setBusy } from '../ui.js';
import { login } from '../auth.js';
import { navigate } from '../router.js';

export function renderLogin() {
    const u = input({ placeholder: 'Логин или Email', name:'username', autocomplete: 'username', required:'required' });
    const p = input({ placeholder: 'Пароль', type: 'password', name:'password', autocomplete: 'current-password', required:'required' });

    const submit = button('Войти', 'btn primary');

    async function onSubmit() {
        if (submit.disabled) return;
        const usernameOrEmail = (u.value || '').trim();
        const password = p.value || '';
        if (!usernameOrEmail || !password) {
            toast('Заполните логин и пароль');
            return;
        }
        setBusy(submit, true);
        try {
            await login(usernameOrEmail, password);
            toast('Успешный вход');
            navigate('/'); // Домой, там автоподгрузка
        } catch (err) {
            toast((err && err.message) || 'Ошибка входа');
        } finally {
            setBusy(submit, false);
        }
    }

    // отправка по Enter
    [u, p].forEach(ctrl => {
        ctrl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                onSubmit();
            }
        });
    });

    // кнопка сабмита
    submit.addEventListener('click', onSubmit);

    const box = card(
        h1('Вход'),
        el('div', {}, [u]),
        el('div', {}, [p]),
        el('div', { class: 'toolbar' }, [
            submit
            // Кнопка "Регистрация" есть в верхней навигации
        ])
    );

    mount(el('div', {}, box));

    // автофокус
    setTimeout(() => u.focus(), 0);
}
