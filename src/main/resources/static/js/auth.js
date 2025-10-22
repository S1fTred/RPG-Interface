import { api, setAuth, getUser, logout, restoreSession } from './api.js';

export async function login(username, password){
  const res = await api.post('/auth/login', { username, password });
  if (!res.ok) throw await res.json().catch(() => ({message:'Ошибка авторизации'}));
  const data = await res.json();
  setAuth({ access: data.accessToken, refresh: data.refreshToken, user: data.user });
  return data;
}

export async function register(username, email, password){
  const res = await api.post('/auth/register', { username, email, password });
  if (!res.ok) throw await res.json().catch(() => ({message:'Ошибка регистрации'}));
  return await login(username, password);
}

export function me(){ return getUser(); }
export function signout(){ logout(); }
export async function boot(){ return await restoreSession(); }
export function hasRole(role){
  const u = getUser(); if (!u) return false;
  return (u.roles || []).includes(role);
}
