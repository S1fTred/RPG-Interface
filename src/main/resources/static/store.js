(function(){
    const subscribers = new Set();

    const state = {
        accessToken: null,
        refreshToken: null,
        user: null // { id, username, roles: [] }
    };

    function notify(){ subscribers.forEach(fn => fn(getState())); }
    function getState(){ return { ...state, roles: state.user?.roles || [] }; }

    function setTokens({ accessToken, refreshToken }){
        state.accessToken = accessToken || null;
        state.refreshToken = refreshToken || null;
        notify();
    }

    function setUser(user){
        state.user = user || null;
        notify();
    }

    function clear(){
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
        notify();
    }

    function subscribe(fn){ subscribers.add(fn); return () => subscribers.delete(fn); }

    window.Store = { getState, setTokens, setUser, clear, subscribe };
})();

