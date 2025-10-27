// js/views/welcome.js — приветственный экран

import { mount } from '../app.js';
import { el, card, h1, button } from '../ui.js';
import { navigate } from '../router.js';

export function renderWelcome() {
    const box = card(
        h1('Добро пожаловать!'),
        el('p', {}, 'Пожалуйста, войдите или зарегистрируйтесь.')
    );

    const actions = el('div', { class: 'toolbar mt-s' }, [
        button('Войти', 'btn primary',   () => { navigate('/login');    }),
        button('Регистрация', 'btn',     () => { navigate('/register'); })
    ]);
    box.appendChild(actions);

    mount(el('div', {}, box));
}
