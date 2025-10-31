(function(){
    const routes = [];
    const guards = [];

    function compile(pattern){
        if(pattern === '*') return { pattern, regex: /^.*$/, handler: null };
        // Escape regex special, then convert '*' to match a path segment
        const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '([^/]+)');
        return { pattern, regex: new RegExp('^' + escaped + '$') };
    }

    function on(path, handler){
        const c = compile(path);
        routes.push({ ...c, handler });
    }

    function renderNotFound(){
        document.getElementById('view-root').innerHTML = '<div class="card">Not found</div>';
    }

    async function handle(path){
        for(const guard of guards){
            const target = await guard(path);
            if(target && target !== path){
                return navigate(target, true);
            }
        }
        let entry = routes.find(r => r.regex.test(path));
        if(!entry) entry = routes.find(r => r.pattern === '*');
        if(entry && entry.handler){ await entry.handler({ path }); }
        else { renderNotFound(); }
    }

    function navigate(path, replace){
        if(replace) history.replaceState({}, '', path);
        else history.pushState({}, '', path);
        return handle(path);
    }

    function start(){
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-link]');
            if(target){
                e.preventDefault();
                navigate(target.getAttribute('data-link'));
            }
        });
        window.addEventListener('popstate', () => handle(location.pathname));
        handle(location.pathname);
    }

    function addGuard(guard){ guards.push(guard); }

    window.Router = { on, start, navigate, addGuard };
})();

