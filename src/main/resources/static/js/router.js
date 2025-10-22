// Tiny hash router
const routes = new Map();
let notFound = null;

export function route(path, handler){ routes.set(path, handler); }
export function setNotFound(handler){ notFound = handler; }

export function navigate(path){
  if (location.hash !== '#' + path) location.hash = path.startsWith('#') ? path : '#' + path;
  else dispatch();
}

export function dispatch(){
  const hash = location.hash.slice(1) || '/';
  const [path, qs] = hash.split('?');
  const handler = routes.get(path) || notFound;
  const params = Object.fromEntries(new URLSearchParams(qs || ''));
  handler && handler({ path, params });
}

window.addEventListener('hashchange', dispatch);
