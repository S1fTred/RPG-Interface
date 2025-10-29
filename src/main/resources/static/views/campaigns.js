(function(){
    function renderCampaigns(){
        const { user } = Store.getState();
        if(!user){ Router.navigate('/login'); return; }
        const root = document.getElementById('view-root');
        root.innerHTML = `
        <div class="card">
            <div class="row" style="justify-content: space-between;">
                <h2>Campaigns</h2>
                <button class="btn" id="create-campaign">New Campaign</button>
            </div>
            <div id="campaign-list">Loading…</div>
        </div>`;

        document.getElementById('create-campaign').onclick = async () => {
            const name = prompt('Campaign name');
            if(!name) return;
            const description = prompt('Description') || '';
            try {
                const created = await API.Campaigns.create({ name, description });
                Router.navigate(`/campaigns/${created.id}`);
            } catch(e) {}
        };

        (async () => {
            try {
                const list = await API.Campaigns.list();
                const container = document.getElementById('campaign-list');
                if(!list?.length){ container.textContent = 'No campaigns yet'; return; }
                container.innerHTML = list.map(c => `
                    <div class="row" style="justify-content: space-between; border-top: 1px solid rgba(124,156,255,0.15); padding: 8px 0;">
                        <div>
                            <div><a data-link="/campaigns/${c.id}">${c.name}</a></div>
                            <div class="muted">${c.description || ''}</div>
                        </div>
                        <div class="row">
                            <a class="btn" data-link="/campaigns/${c.id}">Open</a>
                            <button class="btn danger" data-remove="${c.id}">Delete</button>
                        </div>
                    </div>`).join('');
                container.querySelectorAll('[data-remove]').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        if(!confirm('Delete campaign?')) return;
                        try { await API.Campaigns.remove(btn.getAttribute('data-remove')); renderCampaigns(); } catch(e) {}
                    });
                });
            } catch (e){ document.getElementById('campaign-list').textContent = 'Failed to load'; }
        })();
    }

    Router.on('/campaigns', renderCampaigns);
})();

