// js/app.js — базовая обвязка для mount()

/**
 * Вставляет узел в корневой контейнер #app, очищая его.
 * Все views вызывают mount(rootNode) для отрисовки.
 */
export function mount(node) {
    const root = document.getElementById('app');
    if (!root) throw new Error('Root container #app not found');
    root.innerHTML = '';
    root.appendChild(node);
}
