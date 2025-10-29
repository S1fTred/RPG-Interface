(function(){
    async function renderJournal(){
        const { user } = Store.getState();
        if(!user){ Router.navigate('/login'); return; }
        const path = location.pathname; // /campaigns/{id}/journal
        const parts = path.split('/');
        const campaignId = parts[2];
        const root = document.getElementById('view-root');
        root.innerHTML = `<div class="card">Loading journal…</div>`;
        const include = (new URLSearchParams(location.search)).get('include') || 'player';
        try {
            const [entries] = await Promise.all([
                API.Journal.list(campaignId, include)
            ]);
            root.innerHTML = `
                <div class="card">
                    <div class="row" style="justify-content: space-between;">
                        <h2>Journal</h2>
                        <div class="row">
                            <select id="j-include">
                                <option value="player" ${include==='player'?'selected':''}>Players visible</option>
                                <option value="all" ${include==='all'?'selected':''}>All (GM)</option>
                            </select>
                            <button class="btn" id="j-new">New Entry</button>
                        </div>
                    </div>
                    <div id="j-list"></div>
                </div>`;

            document.getElementById('j-include').onchange = (e) => {
                const v = e.target.value;
                Router.navigate(`/campaigns/${campaignId}/journal?include=${encodeURIComponent(v)}`);
            };
            document.getElementById('j-new').onclick = async () => {
                const title = prompt('Title'); if(!title) return;
                const visibility = prompt('Visibility (PLAYERS/GM_ONLY)', 'PLAYERS') || 'PLAYERS';
                const content = prompt('Content') || '';
                try { await API.Journal.create(campaignId, { title, visibility, type: 'NOTE', content }); renderJournal(); } catch(e){}
            };

            const list = document.getElementById('j-list');
            if(!entries?.length){ list.textContent = 'No entries'; return; }
            list.innerHTML = entries.map(j => `
                <div class="card" style="margin-top: 12px;">
                    <div class="row" style="justify-content: space-between;">
                        <div><strong>${j.title}</strong> <span class="muted">(${j.visibility})</span></div>
                        <div class="row">
                            <button class="btn" data-edit="${j.id}">Edit</button>
                            <button class="btn danger" data-del="${j.id}">Delete</button>
                        </div>
                    </div>
                    <div class="space"></div>
                    <div>${(j.content||'').replaceAll('\n','<br>')}</div>
                </div>`).join('');
            list.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', async () => {
                const entryId = btn.getAttribute('data-edit');
                const title = prompt('Title'); if(!title) return;
                const visibility = prompt('Visibility (PLAYERS/GM_ONLY)', 'PLAYERS') || 'PLAYERS';
                const content = prompt('Content') || '';
                try { await API.Journal.patch(campaignId, entryId, { title, visibility, content }); renderJournal(); } catch(e){}
            }));
            list.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', async () => {
                if(!confirm('Delete entry?')) return;
                const entryId = btn.getAttribute('data-del');
                try { await API.Journal.remove(campaignId, entryId); renderJournal(); } catch(e){}
            }));
        } catch(e){ root.innerHTML = `<div class="card">Failed to load journal</div>`; }
    }

    Router.on('/campaigns/*/journal', renderJournal);
})();

