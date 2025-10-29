(function(){
    function renderAuth(){
        const root = document.getElementById('view-root');
        root.innerHTML = `
        <div class="grid cols-2">
            <div class="card">
                <h2>Welcome to Tabletop RPG Interface</h2>
                <p class="muted">Log in to continue or create a new account.</p>
            </div>
            <div class="card">
                <div class="stack">
                    <h3>Login</h3>
                    <input class="input" id="login-username" placeholder="Username" autocomplete="username">
                    <input class="input" id="login-password" placeholder="Password" type="password" autocomplete="current-password">
                    <button class="btn primary" id="login-btn">Login</button>
                    <div class="space"></div>
                    <h3>Register</h3>
                    <input class="input" id="reg-username" placeholder="Username">
                    <input class="input" id="reg-email" placeholder="Email" type="email">
                    <input class="input" id="reg-password" placeholder="Password" type="password">
                    <button class="btn" id="reg-btn">Register</button>
                </div>
            </div>
        </div>`;

        document.getElementById('login-btn').onclick = async () => {
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;
            try {
                await API.login({ username, password });
                Router.navigate('/');
            } catch (e) {}
        };
        document.getElementById('reg-btn').onclick = async () => {
            const username = document.getElementById('reg-username').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;
            try {
                await API.register({ username, email, password });
                // auto login after register
                await API.login({ username, password });
                Router.navigate('/');
            } catch (e) {}
        };
    }

    Router.on('/login', renderAuth);
})();

