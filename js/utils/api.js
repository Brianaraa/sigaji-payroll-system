/**
 * js/utils/api.js
 * ============================================================
 * Helper untuk semua request ke backend API SiGaji.
 * Menggantikan fungsi localStorage di storage.js.
 *
 * Fitur:
 *   - Base URL otomatis mengarah ke backend (port 3000)
 *   - Otomatis menyisipkan JWT token di setiap request
 *   - Redirect ke login.html jika token expired/tidak ada
 *   - Wrapper method: get(), post(), put(), patch(), del()
 * ============================================================
 */

const API = (() => {

  // Base URL backend — sesuaikan jika port berbeda
  const BASE_URL = 'http://localhost:3000/api';

  // ── Token Management ──────────────────────────────────────

  function getToken() {
    return localStorage.getItem('sigaji_token');
  }

  function setToken(token) {
    localStorage.setItem('sigaji_token', token);
  }

  function setUser(user) {
    localStorage.setItem('sigaji_user', JSON.stringify(user));
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem('sigaji_user'));
    } catch { return null; }
  }

  function logout() {
    localStorage.removeItem('sigaji_token');
    localStorage.removeItem('sigaji_user');
    window.location.replace('login.html');
  }

  // ── Request Helper ────────────────────────────────────────

  async function _request(method, endpoint, body = null) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, options);

      // Token expired → redirect ke login
      if (res.status === 401 || res.status === 403) {
        console.warn('[API] Session habis, redirect ke login...');
        logout();
        return null;
      }

      const data = await res.json();

      if (!res.ok) {
        // Lempar error agar bisa ditangkap di modul pemanggil
        throw new Error(data.message || `HTTP Error ${res.status}`);
      }

      return data;
    } catch (err) {
      // Jika server tidak jalan (Network Error)
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.');
      }
      throw err;
    }
  }

  // ── Public API Methods ────────────────────────────────────

  const get    = (endpoint)       => _request('GET',    endpoint);
  const post   = (endpoint, body) => _request('POST',   endpoint, body);
  const put    = (endpoint, body) => _request('PUT',    endpoint, body);
  const patch  = (endpoint, body) => _request('PATCH',  endpoint, body);
  const del    = (endpoint)       => _request('DELETE', endpoint);

  // ── Auth Shortcut ─────────────────────────────────────────

  async function login(email, password) {
    const res = await post('/login', { email, password });
    if (res && res.success) {
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  }

  // ── Employee Shortcuts ────────────────────────────────────

  const employees = {
    getAll:   (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return get(`/employees${qs ? '?' + qs : ''}`);
    },
    getById:  (id)   => get(`/employees/${id}`),
    create:   (data) => post('/employees', data),
    update:   (id, data) => put(`/employees/${id}`, data),
    delete:   (id)   => del(`/employees/${id}`),
  };

  // ── Payroll Shortcuts ─────────────────────────────────────

  const payroll = {
    getAll:   (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return get(`/payroll${qs ? '?' + qs : ''}`);
    },
    getById:  (id)   => get(`/payroll/${id}`),
    save:     (data) => post('/payroll', data),
    markPaid: (id)   => patch(`/payroll/${id}/bayar`),
    delete:   (id)   => del(`/payroll/${id}`),
  };

  // ── Dashboard Shortcuts ───────────────────────────────────

  const dashboard = {
    summary: (bulan, tahun) => {
      const qs = new URLSearchParams({ bulan, tahun }).toString();
      return get(`/dashboard/summary?${qs}`);
    },
    dept: () => get('/dashboard/dept'),
  };

  // ── Health Check ──────────────────────────────────────────

  const health = () => get('/health');

  return {
    BASE_URL,
    getToken, setToken, getUser, setUser, logout,
    get, post, put, patch, del,
    login,
    employees,
    payroll,
    dashboard,
    health,
  };

})();
