(function(){
    // Закрытые API под /api (относительно контекста), открытые auth — под /auth (тоже относительно)
    const apiBase  = 'api';
    const openBase = 'auth';

    let isRefreshing = false;
    const pendingQueue = [];

    /* ===== utils ===== */
    function showToast(msg){
        const el = document.getElementById('toast');
        if(!el) return;
        el.textContent = msg;
        el.hidden = false;
        setTimeout(()=>{ el.hidden = true; }, 3000);
    }
    const safeJson = (t)=>{ try{ return t ? JSON.parse(t) : null; }catch{ return null; } };
    const pickAccess  = (o)=> o && (o.accessToken || o.access || o.token) || null;
    const pickRefresh = (o)=> o && (o.refreshToken || o.refresh) || null;

    function decodeJwtPayload(tok){
        if(!tok || tok.split('.').length<2) return null;
        const b64 = tok.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
        try{
            const json = atob(b64);
            return JSON.parse(decodeURIComponent([...json].map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')));
        }catch{
            try{ return JSON.parse(atob(b64)); }catch{ return null; }
        }
    }
    function userFromClaims(cl){
        if(!cl) return null;
        const id = cl.userId || cl.uid || cl.id || (cl.sub && /^[0-9a-fA-F-]{32,36}$/.test(cl.sub) ? cl.sub : null);
        const username = cl.username || cl.preferred_username || (id ? null : cl.sub) || null;
        let roles = cl.roles || cl.authorities || cl.scope || [];
        if(typeof roles === 'string') roles = roles.split(/[,\s]+/).filter(Boolean);
        return (id || username) ? { id, username, email: cl.email || null, roles } : null;
    }
    function ensureUserFrom(data){
        if (data && data.user && (data.user.id || data.user.username)){
            Store.setUser({ id:data.user.id, username:data.user.username, roles:data.user.roles||data.user.authorities||[] });
            return true;
        }
        if (data && (data.id || data.username)){
            Store.setUser({ id:data.id||null, username:data.username||null, roles:data.roles||data.authorities||[] });
            return true;
        }
        const acc = pickAccess(data);
        const u = userFromClaims(decodeJwtPayload(acc));
        if (u){ Store.setUser(u); return true; }
        return false;
    }

    /* ===== закрытые запросы (/api) ===== */
    async function request(path, options = {}, retry = true){
        const { accessToken } = Store.getState();
        const headers = new Headers(options.headers || {});
        headers.set('Accept','application/json');

        const hasBody = options.body !== undefined && options.body !== null;
        const isForm  = hasBody && typeof FormData!=='undefined' && (options.body instanceof FormData);
        if (hasBody && !isForm && !headers.has('Content-Type')) headers.set('Content-Type','application/json');

        if (accessToken) headers.set('Authorization', 'Bearer ' + accessToken);

        const res = await fetch(apiBase + path, { ...options, headers });

        if (res.status === 401 && retry){
            return handle401(() => request(path, options, false));
        }

        if (res.status === 204) return null;

        const text = await res.text();
        const data = safeJson(text);

        if (!res.ok){
            const message = (data && (data.message || data.error)) || res.statusText || 'Request failed';
            showToast(message);
            throw new Error(message);
        }
        return data;
    }

    async function handle401(callback){
        if (isRefreshing){
            return new Promise((resolve, reject)=> pendingQueue.push({ resolve, reject, callback }));
        }
        isRefreshing = true;
        try{
            await refreshTokens();
            const result = await callback();
            while (pendingQueue.length){
                const p = pendingQueue.shift();
                p.resolve(p.callback());
            }
            return result;
        }catch(e){
            while (pendingQueue.length){
                const p = pendingQueue.shift();
                p.reject(e);
            }
            Store.clear();
            Router.navigate('/login');
            showToast(e?.message || 'Authentication required');
            throw e;
        }finally{
            isRefreshing = false;
        }
    }

    /* ===== открытые /auth (относительные пути!) ===== */
    async function authFetch(relPath, bodyObj, { silent=false } = {}){
        // ВАЖНО: без ведущего слэша — уважает context-path (например, /RPG-Interface)
        const res = await fetch(openBase + relPath, {
            method: 'POST',
            headers: { 'Accept':'application/json', 'Content-Type':'application/json' },
            body: JSON.stringify(bodyObj)
        });
        const text = await res.text();
        const data = safeJson(text);
        if (!res.ok){
            const msg = (data && (data.message || data.error)) || res.statusText || 'Request failed';
            if (!silent) showToast(msg);
            throw new Error(msg);
        }
        return data;
    }

    async function login({ username, password }){
        // Пробуем несколько форматов. Тост не показываем, пока есть ещё варианты.
        const tries = [
            { body:{ username, password } },
            { body:{ email: username, password } },
            { body:{ login: username, password } }
        ];
        let lastErr = null;
        for (let i=0;i<tries.length;i++){
            try{
                const data = await authFetch('/login', tries[i].body, { silent:true });
                const access  = pickAccess(data);
                const refresh = pickRefresh(data);
                if (!access || !refresh) throw new Error('Invalid auth response');

                Store.setTokens({ accessToken: access, refreshToken: refresh });
                ensureUserFrom(data);
                return data;
            }catch(e){
                lastErr = e;
                // пробуем следующий вариант
            }
        }
        // если все варианты не зашли — покажем последнюю ошибку
        showToast(lastErr?.message || 'Login failed');
        throw lastErr || new Error('Login failed');
    }

    async function register({ username, email, password }){
        return await authFetch('/register', { username, email, password });
    }

    async function refreshTokens(){
        const { refreshToken } = Store.getState();
        if (!refreshToken) throw new Error('No refresh token');

        const bodies = [
            { refreshToken },
            { refresh: refreshToken },
            { token: refreshToken }
        ];
        let lastErr = null;
        for (let i=0;i<bodies.length;i++){
            try{
                const r = await fetch(openBase + '/refresh', {
                    method:'POST',
                    headers:{ 'Accept':'application/json', 'Content-Type':'application/json' },
                    body: JSON.stringify(bodies[i])
                });
                const text = await r.text();
                const j = safeJson(text);
                if (!r.ok) throw new Error((j && (j.message || j.error)) || 'Refresh failed');

                const access  = pickAccess(j);
                const nextRef = pickRefresh(j) || refreshToken;
                if (!access) throw new Error('No access token');

                Store.setTokens({ accessToken: access, refreshToken: nextRef });
                if (!ensureUserFrom(j)){
                    const u = userFromClaims(decodeJwtPayload(access));
                    if (u) Store.setUser(u);
                }
                return j;
            }catch(e){ lastErr = e; }
        }
        throw lastErr || new Error('Refresh failed');
    }

    /* ===== domain API ===== */
    const Campaigns = {
        list: ()        => request('/campaigns', { method:'GET' }),
        get:  (id)      => request(`/campaigns/${id}`, { method:'GET' }),
        create:(p)      => request('/campaigns', { method:'POST', body: JSON.stringify(p) }),
        patch:(id,p)    => request(`/campaigns/${id}`, { method:'PATCH', body: JSON.stringify(p) }),
        remove:(id)     => request(`/campaigns/${id}`, { method:'DELETE' })
    };

    const Members = {
        list:(campaignId)                 => request(`/campaigns/${campaignId}/members`, { method:'GET' }),
        upsert:(campaignId,userId,role)   => request(`/campaigns/${campaignId}/members/${userId}`, { method:'PUT', body: JSON.stringify({ roleInCampaign: role }) }),
        changeRole:(campaignId,userId,role)=> request(`/campaigns/${campaignId}/members/${userId}`, { method:'PATCH', body: JSON.stringify({ roleInCampaign: role }) }),
        remove:(campaignId,userId)        => request(`/campaigns/${campaignId}/members/${userId}`, { method:'DELETE' })
    };

    const Characters = {
        create:(campaignId,p) => request(`/campaigns/${campaignId}/characters`, { method:'POST', body: JSON.stringify(p) }),
        get:(id)              => request(`/characters/${id}`, { method:'GET' }),
        patch:(id,p)          => request(`/characters/${id}`, { method:'PATCH', body: JSON.stringify(p) }),
        patchHp:(id,hp)       => request(`/characters/${id}/hp?hp=${encodeURIComponent(hp)}`, { method:'PATCH' }),
        remove:(id)           => request(`/characters/${id}`, { method:'DELETE' })
    };

    const Journal = {
        list:(campaignId,include)=> request(`/campaigns/${campaignId}/journal?include=${encodeURIComponent(include||'player')}`, { method:'GET' }),
        create:(campaignId,p)    => request(`/campaigns/${campaignId}/journal`, { method:'POST', body: JSON.stringify(p) }),
        patch:(campaignId,entry,p)=> request(`/campaigns/${campaignId}/journal/${entry}`, { method:'PATCH', body: JSON.stringify(p) }),
        remove:(campaignId,entry)=> request(`/campaigns/${campaignId}/journal/${entry}`, { method:'DELETE' })
    };

    const Items = {
        list: ()     => request('/items', { method:'GET' }),
        create:(p)   => request('/items', { method:'POST', body: JSON.stringify(p) }),
        patch:(id,p) => request(`/items/${id}`, { method:'PATCH', body: JSON.stringify(p) }),
        remove:(id)  => request(`/items/${id}`, { method:'DELETE' })
    };

    window.API = { request, login, register, refreshTokens, Campaigns, Members, Characters, Journal, Items };
})();
