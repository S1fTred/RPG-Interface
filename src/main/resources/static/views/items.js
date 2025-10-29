(function(){
    async function renderItems(){
        const { user, roles } = Store.getState();
        if(!user){ Router.navigate('/login'); return; }
        if(!roles.includes('ADMIN')){ document.getElementById('view-root').innerHTML = '<div class="card">Forbidden</div>'; return; }
        const root = document.getElementById('view-root');
        root.innerHTML = `<div class="card">Loading items…</div>`;
        try {
            const items = await API.Items.list();
            root.innerHTML = `
                <div class="card">
                    <div class="row" style="justify-content: space-between;">
                        <h2>Items Catalog</h2>
                        <button class="btn" id="i-new">New Item</button>
                    </div>
                    <div id="i-list"></div>
                </div>`;
            document.getElementById('i-new').onclick = async () => {
                const name = prompt('Name'); if(!name) return;
                const description = prompt('Description') || '';
                const weight = Number(prompt('Weight', '0')) || 0;
                const price = Number(prompt('Price', '0')) || 0;
                try { await API.Items.create({ name, description, weight, price }); renderItems(); } catch(e){}
            };
            const list = document.getElementById('i-list');
            if(!items?.length){ list.textContent = 'No items'; return; }
            list.innerHTML = items.map(it => `
                <div class="row" style="justify-content: space-between; border-top: 1px solid rgba(124,156,255,0.15); padding: 8px 0;">
                    <div>
                        <div><strong>${it.name}</strong> — <span class="muted">${it.price} gp, ${it.weight} lb</span></div>
                        <div class="muted">${it.description || ''}</div>
                    </div>
                    <div class="row">
                        <button class="btn" data-edit="${it.id}">Edit</button>
                        <button class="btn danger" data-del="${it.id}">Delete</button>
                    </div>
                </div>`).join('');
            list.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-edit');
                const name = prompt('Name'); if(!name) return;
                const description = prompt('Description') || '';
                const weight = Number(prompt('Weight', '0')) || 0;
                const price = Number(prompt('Price', '0')) || 0;
                try { await API.Items.patch(id, { name, description, weight, price }); renderItems(); } catch(e){}
            }));
            list.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', async () => {
                if(!confirm('Delete item?')) return;
                const id = btn.getAttribute('data-del');
                try { await API.Items.remove(id); renderItems(); } catch(e){}
            }));
        } catch(e){ root.innerHTML = `<div class="card">Failed to load items</div>`; }
    }

    Router.on('/items', renderItems);
})();

