// src/main/resources/static/js/views/login.js
import { mount } from '../app.js';
import { el, card, h1, input, button, toast } from '../ui.js';
import { login } from '../auth.js';
import { navigate } from '../router.js';

export function renderLogin() {
    const u = input({ placeholder: 'Логин или Email', autocomplete: 'username' });
    const p = input({ placeholder: 'Пароль', type: 'password', autocomplete: 'current-password' });

    const submit = button('Войти', 'btn primary', onSubmit);

    // отправка по Enter
    [u, p].forEach(ctrl => {
        ctrl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                onSubmit();
            }
        });
    });

    async function onSubmit() {
        if (submit.disabled) return;
        submit.disabled = true;
        const origText = submit.textContent;
        submit.textContent = 'Входим…';
        try {
            const usernameOrEmail = (u.value || '').trim();
            const password = p.value || '';
            if (!usernameOrEmail || !password) {
                throw new Error('Заполните логин и пароль');
            }
            await login(usernameOrEmail, password);
            toast('Успешный вход');
            navigate('/'); // на "Главная" — там автоподгрузка данных
        } catch (err) {
            toast((err && err.message) || 'Ошибка входа');
        } finally {
            submit.disabled = false;
            submit.textContent = origText;
        }
    }

    const box = card(
        h1('Вход'),
        el('div', {}, [u]),
        el('div', {}, [p]),
        el('div', { class: 'toolbar' }, [
            submit,
            // Кнопку "Регистрация" внутри формы убрали — она есть в правом верхнем углу навигации
        ])
    );

    mount(el('div', {}, box));
}
