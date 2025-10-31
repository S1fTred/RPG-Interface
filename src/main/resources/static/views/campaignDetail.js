(function(){
    async function renderDetail(ctx){
        const { user, roles } = Store.getState();
        if(!user){ Router.navigate('/login'); return; }
        const id = location.pathname.split('/').pop();
        const root = document.getElementById('view-root');
        root.innerHTML = `<div class="card">Loading campaign…</div>`;
        try {
            const campaign = await API.Campaigns.get(id);
            const isGM = roles.includes('GAME_MASTER') && campaign.gm && campaign.gm.id === user.id;
            root.innerHTML = `
                <div class="grid cols-2">
                    <div class="card">
                        <h2>${campaign.name}</h2>
                        <div class="muted">${campaign.description || ''}</div>
                        ${isGM ? `<div class="space"></div>
                            <div class="stack">
                                <label>Name</label>
                                <input class="input" id="c-name" value="${campaign.name}">
                                <label>Description</label>
                                <textarea class="input" id="c-desc">${campaign.description || ''}</textarea>
                                <button class="btn" id="c-save">Save</button>
                            </div>` : ''}
                    </div>
                    <div class="card">
                        <div class="row" style="justify-content: space-between;">
                            <h3>Members</h3>
                            ${isGM ? '<button class="btn" id="m-add">Add Member</button>' : ''}
                        </div>
                        <div id="members">Loading…</div>
                    </div>
                </div>
                <div class="space"></div>
                <div class="grid cols-2">
                    <div class="card">
                        <div class="row" style="justify-content: space-between;">
                            <h3>Journal</h3>
                            <a class="btn" data-link="/campaigns/${campaign.id}/journal">Open Journal</a>
                        </div>
                    </div>
                    <div class="card">
                        <div class="row" style="justify-content: space-between;">
                            <h3>Characters</h3>
                            <a class="btn" data-link="/characters">Open Characters</a>
                        </div>
                    </div>
                </div>`;

            if(isGM){
                document.getElementById('c-save').onclick = async () => {
                    const name = document.getElementById('c-name').value.trim();
                    const description = document.getElementById('c-desc').value;
                    try { await API.Campaigns.patch(campaign.id, { name, description }); } catch(e){}
                };
                document.getElementById('m-add').onclick = async () => {
                    const userId = prompt('User ID to add');
                    if(!userId) return;
                    const roleInCampaign = prompt('Role in campaign (GM/PLAYER)', 'PLAYER') || 'PLAYER';
                    try { await API.Members.upsert(campaign.id, userId, roleInCampaign); loadMembers(); } catch(e){}
                };
            }

            async function loadMembers(){
                try {
                    const members = await API.Members.list(campaign.id);
                    const container = document.getElementById('members');
                    container.innerHTML = members.map(m => `
                        <div class="row" style="justify-content: space-between; border-top: 1px solid rgba(124,156,255,0.15); padding: 8px 0;">
                            <div>${m.user.username} — ${m.roleInCampaign}</div>
                            ${isGM ? `<div class="row">
                                <button class="btn" data-role="${m.user.id}">Change Role</button>
                                <button class="btn danger" data-remove="${m.user.id}">Remove</button>
                            </div>` : ''}
                        </div>`).join('');
                    if(isGM){
                        container.querySelectorAll('[data-role]').forEach(btn => btn.addEventListener('click', async () => {
                            const userId = btn.getAttribute('data-role');
                            const roleInCampaign = prompt('New role (GM/PLAYER)', 'PLAYER') || 'PLAYER';
                            try { await API.Members.changeRole(campaign.id, userId, roleInCampaign); loadMembers(); } catch(e){}
                        }));
                        container.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', async () => {
                            if(!confirm('Remove member?')) return;
                            const userId = btn.getAttribute('data-remove');
                            try { await API.Members.remove(campaign.id, userId); loadMembers(); } catch(e){}
                        }));
                    }
                } catch(e){ document.getElementById('members').textContent = 'Failed to load'; }
            }
            loadMembers();
        } catch(e){
            document.getElementById('view-root').innerHTML = `<div class="card">Failed to load campaign</div>`;
        }
    }

    Router.on('/campaigns/*', renderDetail);
})();

