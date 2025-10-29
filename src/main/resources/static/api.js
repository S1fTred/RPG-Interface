(function(){
    // Use relative base to support non-root servlet context paths (e.g., /RPG-Interface)
    const baseURL = 'api';
    let isRefreshing = false;
    let pendingQueue = [];

    function showToast(msg){
        const el = document.getElementById('toast');
        if(!el) return;
        el.textContent = msg;
        el.hidden = false;
        setTimeout(() => { el.hidden = true; }, 3000);
    }

    async function request(path, options = {}, retry = true){
        const { accessToken } = Store.getState();
        const headers = new Headers(options.headers || {});
        headers.set('Accept', 'application/json');
        if(!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
        if(accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

        const res = await fetch(baseURL + path, { ...options, headers });
        if(res.status === 401 && retry){
            return handle401(() => request(path, options, false));
        }
        if(res.status === 204) return null;
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        if(!res.ok){
            const message = data?.message || data?.error || res.statusText;
            showToast(message || 'Request failed');
            throw new Error(message);
        }
        return data;
    }

    async function handle401(callback){
        if(isRefreshing){
            return new Promise((resolve, reject) => {
                pendingQueue.push({ resolve, reject, callback });
            });
        }
        isRefreshing = true;
        try {
            await refreshTokens();
            const result = await callback();
            pendingQueue.forEach(p => p.resolve(p.callback()));
            pendingQueue = [];
            return result;
        } catch (e){
            pendingQueue.forEach(p => p.reject(e));
            pendingQueue = [];
            throw e;
        } finally {
            isRefreshing = false;
        }
    }

    async function login({ username, password }){
        const data = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        }, false);
        Store.setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        Store.setUser({ id: data.id, username: data.username, roles: data.roles });
        return data;
    }

    async function register({ username, email, password }){
        const data = await request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        }, false);
        return data;
    }

    async function refreshTokens(){
        const { refreshToken } = Store.getState();
        if(!refreshToken){
            Store.clear();
            Router.navigate('/login');
            throw new Error('No refresh token');
        }
        const data = await fetch(baseURL + '/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ refreshToken })
        }).then(async r => {
            const t = await r.text();
            const j = t ? JSON.parse(t) : null;
            if(!r.ok) throw new Error(j?.message || 'Refresh failed');
            return j;
        });
        Store.setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken || refreshToken });
        if(data.username){
            Store.setUser({ id: data.id, username: data.username, roles: data.roles });
        }
        return data;
    }

    // Domain API helpers
    const Campaigns = {
        list: () => request('/campaigns', { method: 'GET' }),
        get: (id) => request(`/campaigns/${id}`, { method: 'GET' }),
        create: (payload) => request('/campaigns', { method: 'POST', body: JSON.stringify(payload) }),
        patch: (id, payload) => request(`/campaigns/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
        remove: (id) => request(`/campaigns/${id}`, { method: 'DELETE' })
    };

    const Members = {
        list: (campaignId) => request(`/campaigns/${campaignId}/members`, { method: 'GET' }),
        upsert: (campaignId, userId, roleInCampaign) => request(`/campaigns/${campaignId}/members/${userId}`, { method: 'PUT', body: JSON.stringify({ roleInCampaign }) }),
        changeRole: (campaignId, userId, roleInCampaign) => request(`/campaigns/${campaignId}/members/${userId}`, { method: 'PATCH', body: JSON.stringify({ roleInCampaign }) }),
        remove: (campaignId, userId) => request(`/campaigns/${campaignId}/members/${userId}`, { method: 'DELETE' })
    };

    const Characters = {
        create: (campaignId, payload) => request(`/campaigns/${campaignId}/characters`, { method: 'POST', body: JSON.stringify(payload) }),
        get: (id) => request(`/characters/${id}`, { method: 'GET' }),
        patch: (id, payload) => request(`/characters/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
        patchHp: (id, hp) => request(`/characters/${id}/hp?hp=${encodeURIComponent(hp)}`, { method: 'PATCH' }),
        remove: (id) => request(`/characters/${id}`, { method: 'DELETE' })
    };

    const Journal = {
        list: (campaignId, include) => request(`/campaigns/${campaignId}/journal?include=${encodeURIComponent(include||'player')}`, { method: 'GET' }),
        create: (campaignId, payload) => request(`/campaigns/${campaignId}/journal`, { method: 'POST', body: JSON.stringify(payload) }),
        patch: (campaignId, entryId, payload) => request(`/campaigns/${campaignId}/journal/${entryId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
        remove: (campaignId, entryId) => request(`/campaigns/${campaignId}/journal/${entryId}`, { method: 'DELETE' })
    };

    const Items = {
        list: () => request('/items', { method: 'GET' }),
        create: (payload) => request('/items', { method: 'POST', body: JSON.stringify(payload) }),
        patch: (id, payload) => request(`/items/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
        remove: (id) => request(`/items/${id}`, { method: 'DELETE' })
    };

    window.API = { request, login, register, refreshTokens, Campaigns, Members, Characters, Journal, Items };
})();

