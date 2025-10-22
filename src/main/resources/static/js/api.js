// Minimal API helper with auto-refresh
const BASE_URL = localStorage.getItem('apiUrl') || 'http://localhost:8080';

let accessToken = null;
let refreshToken = null;
let currentUser = null;

export function setApiUrl(url){ localStorage.setItem('apiUrl', url); }
export function getApiUrl(){ return localStorage.getItem('apiUrl') || BASE_URL; }

export function setAuth({ access, refresh, user }){
  accessToken = access || null;
  refreshToken = refresh || null;
  currentUser = user || null;
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  if (user) localStorage.setItem('user', JSON.stringify(user));
  if (!refreshToken) localStorage.removeItem('refreshToken');
}

export function getUser(){ 
  if (currentUser) return currentUser;
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export async function restoreSession(){
  accessToken = null;
  refreshToken = localStorage.getItem('refreshToken');
  const userRaw = localStorage.getItem('user');
  currentUser = userRaw ? JSON.parse(userRaw) : null;
  if (!refreshToken) return null;
  try{
    const res = await fetch(getApiUrl() + '/auth/refresh', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    if (!res.ok) throw new Error('refresh failed');
    const data = await res.json();
    accessToken = data.accessToken;
    refreshToken = data.refreshToken || refreshToken;
    if (data.user) { currentUser = data.user; localStorage.setItem('user', JSON.stringify(data.user)); }
    return accessToken;
  }catch(e){
    logout();
    return null;
  }
}

export function logout(){
  accessToken = null;
  refreshToken = null;
  currentUser = null;
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

async function doFetch(path, opts = {}, retry = true){
  const headers = Object.assign({ 'Content-Type':'application/json' }, opts.headers || {});
  if (accessToken) headers['Authorization'] = 'Bearer ' + accessToken;
  const res = await fetch(getApiUrl() + path, { ...opts, headers });
  if (res.status === 401 && retry && refreshToken){
    const ok = await restoreSession();
    if (ok){
      return doFetch(path, opts, false);
    }
  }
  return res;
}

export const api = {
  get: (p) => doFetch(p, { method:'GET' }),
  post: (p, body) => doFetch(p, { method:'POST', body: JSON.stringify(body) }),
  put: (p, body) => doFetch(p, { method:'PUT', body: JSON.stringify(body) }),
  patch: (p, body) => doFetch(p, { method:'PATCH', body: JSON.stringify(body) }),
  del: (p) => doFetch(p, { method:'DELETE' }),
};
