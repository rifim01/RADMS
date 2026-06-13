/**
 * auth.js — Session & login management (localStorage)
 */

const Auth = (() => {
  const KEY_TOKEN = 'rifim_pr_token';
  const KEY_USER  = 'rifim_pr_user';

  function getToken()  { return localStorage.getItem(KEY_TOKEN); }
  function getUser()   {
    try { return JSON.parse(localStorage.getItem(KEY_USER)) || null; } catch { return null; }
  }
  function isLoggedIn(){ return !!getToken(); }

  function setSession(token, user) {
    localStorage.setItem(KEY_TOKEN, token);
    localStorage.setItem(KEY_USER, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(KEY_TOKEN);
    localStorage.removeItem(KEY_USER);
  }

  async function login(email, password) {
    const res = await API.login(email, password);
    if (!res.success) throw new Error(res.error || 'Login gagal');
    setSession(res.token, res.user);
    return res.user;
  }

  function logout() {
    clearSession();
    window.location.href = 'index.html';
  }

  function requireAuth() {
    if (!isLoggedIn()) { window.location.href = 'index.html'; return false; }
    return true;
  }

  function hasRole(...roles) {
    const user = getUser();
    if (!user) return false;
    return roles.includes(user.role);
  }

  function canManageCabang(idCabang) {
    const user = getUser();
    if (!user) return false;
    if (user.role === 'OWNER' || user.role === 'SUPER_ADMIN') return true;
    return user.idCabang === idCabang;
  }

  return { getToken, getUser, isLoggedIn, login, logout, requireAuth, hasRole, canManageCabang };
})();
