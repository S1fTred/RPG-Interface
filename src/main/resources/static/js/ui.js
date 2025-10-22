// Minimal UI helpers
export function el(tag, attrs={}, children=[]){
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v]) => {
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
