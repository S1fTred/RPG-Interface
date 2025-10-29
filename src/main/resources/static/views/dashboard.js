(function(){
    function buildNav(){
        const navTpl = document.getElementById('nav-template');
        const frag = navTpl.content.cloneNode(true);
        const links = frag.getElementById('nav-links');
        const userEl = frag.getElementById('nav-user');
        const { user, roles } = Store.getState();

        links.innerHTML = '';
        const addLink = (href, label) => {
            const a = document.createElement('a');
            a.href = href;
            a.setAttribute('data-link', href);
            a.textContent = label;
            if(location.pathname === href) a.classList.add('active');
            links.appendChild(a);
        };

        if(user){
            addLink('/', 'Dashboard');
            addLink('/campaigns', 'Campaigns');
            addLink('/characters', 'Characters');
            if(roles.includes('ADMIN')) addLink('/items', 'Items');

            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.textContent = `Logout (${user.username})`;
            btn.onclick = () => { Store.clear(); Router.navigate('/login'); };
            userEl.replaceChildren(btn);
        } else {
            addLink('/login', 'Login');
        }

        const app = document.getElementById('app');
        const old = app.querySelector('.top-nav');
        if(old) old.remove();
        app.prepend(frag);
    }

    function renderDashboard(){
        buildNav();
        const root = document.getElementById('view-root');
        const { user, roles } = Store.getState();
        if(!user){ Router.navigate('/login'); return; }
        root.innerHTML = `
        <div class="grid cols-3">
            <div class="card">
                <h3>Your Campaigns</h3>
                <div id="dash-campaigns">Loading…</div>
            </div>
            <div class="card">
                <h3>Your Characters</h3>
                <div id="dash-characters">Loading…</div>
            </div>
            <div class="card">
                <h3>Quick Actions</h3>
                <div class="stack">
                    ${roles.includes('ADMIN') ? '<a data-link="/items" class="btn">Manage Items</a>' : ''}
                    <a data-link="/campaigns" class="btn">Open Campaigns</a>
                    <a data-link="/characters" class="btn">Open Characters</a>
                </div>
            </div>
        </div>`;

        (async () => {
            try {
                const campaigns = await API.Campaigns.list();
                const el = document.getElementById('dash-campaigns');
                if(!campaigns?.length){ el.textContent = 'No campaigns yet'; }
                else {
                    el.innerHTML = campaigns.map(c => `<div><a data-link="/campaigns/${c.id}">${c.name}</a></div>`).join('');
                }
            } catch(e) { document.getElementById('dash-campaigns').textContent = 'Failed to load'; }
        })();
        // Characters endpoint to list all user characters isn't specified; we keep dashboard light.
        document.getElementById('dash-characters').textContent = 'Open Characters to manage';
    }

    Router.on('/', renderDashboard);
    Store.subscribe(buildNav);
})();

