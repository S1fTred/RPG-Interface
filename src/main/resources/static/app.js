(function(){
    // Basic client-side diagnostics to surface JS errors
    function showToast(msg){
        const el = document.getElementById('toast');
        if(!el) return;
        el.textContent = String(msg || 'Error');
        el.hidden = false;
        setTimeout(() => { el.hidden = true; }, 5000);
    }
    window.addEventListener('error', (e) => { try { showToast(e.message); } catch(_){} });
    window.addEventListener('unhandledrejection', (e) => { try { showToast(e.reason?.message || e.reason || 'Unhandled rejection'); } catch(_){} });

    // Remove loading indicator once JS is running
    const loading = document.querySelector('.app-loading');
    if(loading) loading.remove();

    Router.addGuard(async (path) => {
        const publicPaths = ['/login'];
        const { user } = Store.getState();
        if(!user && !publicPaths.includes(path)) return '/login';
        return null;
    });

    // fallback route
    Router.on('*', () => {
        document.getElementById('view-root').innerHTML = '<div class="card">Page not found</div>';
    });

    // Start app
    Router.start();
})();

