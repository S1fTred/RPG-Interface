(function(){
    function renderCharacters(){
        const { user } = Store.getState();
        if(!user){ Router.navigate('/login'); return; }
        const root = document.getElementById('view-root');
        root.innerHTML = `
        <div class="card">
            <div class="row" style="justify-content: space-between;">
                <h2>Your Characters</h2>
                <button class="btn" id="create-char">New Character (in Campaign)</button>
            </div>
            <div class="muted">Use campaign page to create characters bound to it.</div>
        </div>`;

        document.getElementById('create-char').onclick = async () => {
            const campaignId = prompt('Campaign ID');
            if(!campaignId) return;
            const name = prompt('Character name');
            if(!name) return;
            const clazz = prompt('Class', 'Fighter') || 'Fighter';
            const race = prompt('Race', 'Human') || 'Human';
            try {
                await API.Characters.create(campaignId, { name, clazz, race });
                alert('Character created');
            } catch(e){}
        };
    }

    Router.on('/characters', renderCharacters);
})();

