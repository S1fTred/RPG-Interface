// js/ui.js — минимальные UI-хелперы + дополнения под экраны

// ===== базовые DOM хелперы (как было) =====
export function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
        if (k === 'class') node.className = v;
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.substring(2), v);
        else if (v !== undefined && v !== null) node.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : [children])
        .filter(Boolean)
        .forEach(c => node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return node;
}

export function h1(t){ return el('h1',{},t); }
export function h2(t){ return el('h2',{},t); }
export function card(...children){ return el('div',{class:'card'}, children); }
export function input(attrs={}){ return el('input', Object.assign({class:'input'},attrs)); }
export function textarea(attrs={}){ return el('textarea', Object.assign({class:'textarea'},attrs)); }
export function select(attrs={}, options=[]){
    const s = el('select', Object.assign({class:'select'},attrs));
    options.forEach(o => s.appendChild(el('option',{value:o.value, selected:o.selected? 'selected':null}, o.label)));
    return s;
}
export function button(text, cls='btn', onclick=null){
    return el('button',{class:cls, onClick:onclick}, text);
}
export function table(headings=[], rows=[]){
    const thead = el('thead',{}, el('tr',{}, headings.map(h=>el('th',{},h))));
    const tbody = el('tbody',{}, rows.map(r=> el('tr',{}, r.map(c=> el('td',{}, c)))));
    return el('table',{class:'table'}, [thead, tbody]);
}
export function toolbar(...btns){ return el('div',{class:'toolbar'}, btns); }
export function badge(t){ return el('span',{class:'badge'}, t); }
export function kv(label, value){ return el('div',{class:'kv'}, [el('div',{},label), el('div',{},value)]); }

let toastEl = null;
export function toast(msg){
    if (toastEl) toastEl.remove();
    toastEl = el('div',{class:'toast'}, msg);
    document.body.appendChild(toastEl);
    setTimeout(()=> toastEl && toastEl.remove(), 3000);
}

// ===== дополнения для модулей экранов =====
export function $(sel, root = document){ return root.querySelector(sel); }
export function $all(sel, root = document){ return Array.from(root.querySelectorAll(sel)); }

/** Включает/выключает кнопку со визуальным состоянием */
export function setBusy(btn, busy){
    if (!btn) return;
    btn.disabled = !!busy;
    if (busy) btn.setAttribute('data-busy','1'); else btn.removeAttribute('data-busy');
}

/** Простой confirm для опасных действий */
export function confirmDanger(msg = 'Подтвердите действие'){
    return window.confirm(msg);
}

/** Генерирует скелетон-строки списка */
export function skeleton(rows = 3){
    const frag = document.createDocumentFragment();
    for (let i=0;i<rows;i++){
        const d = document.createElement('div');
        d.className = 'row';
        d.innerHTML = '<div class="skeleton" style="width:70%"></div>';
        frag.appendChild(d);
    }
    return frag;
}

/**
 * Преобразует <form> в object.
 * Пустые поля пропускаются, некоторые ключи приводим к числу.
 */
export function formToJson(form){
    const fd = new FormData(form);
    const obj = {};
    const numeric = new Set(['id','userId','level','hp','maxHp','delta','set','campaignId','characterId']);
    for (const [k,v] of fd.entries()){
        if (v === '') continue; // не посылать пустые optional
        if (numeric.has(k) && !isNaN(v)) obj[k] = Number(v);
        else if (k === 'tags') {
            // поддержка "теги через запятую"
            obj[k] = String(v).split(',').map(t => t.trim()).filter(Boolean);
        } else {
            obj[k] = v;
        }
    }
    return obj;
}

/** Экранирует HTML-строку (на всякий случай) */
export function escapeHtml(s){
    return String(s ?? '').replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}
