import axios from 'axios';

// ─── Access token — closure memory + sessionStorage for reload persistence ───
let _accessToken = typeof window !== 'undefined' ? sessionStorage.getItem('vault_access_token') || null : null;

export const setAccessToken = (t) => {
  _accessToken = t;
  if (typeof window !== 'undefined') {
    if (t) sessionStorage.setItem('vault_access_token', t);
    else sessionStorage.removeItem('vault_access_token');
  }
};

export const getAccessToken = () => _accessToken;

export const clearAccessToken = () => {
  _accessToken = null;
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('vault_access_token');
  }
};

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const cleanBaseUrl = rawBaseUrl.trim().replace(/\/+$/, '');
const BASE_URL = cleanBaseUrl.endsWith('/api') ? cleanBaseUrl : `${cleanBaseUrl}/api`;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send httpOnly refresh-token cookie automatically
  timeout: 30_000,
});

// ─── Request: attach access token ─────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// ─── Response: handle 401 → refresh → retry ───────────────────────────────
let _isRefreshing = false;
let _queue = []; // pending requests waiting for refresh

const drainQueue = (err, token = null) => {
  _queue.forEach(({ resolve, reject }) => (err ? reject(err) : resolve(token)));
  _queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // Do NOT attempt token refresh for auth endpoints (login/register/refresh)
    const isAuthEndpoint =
      original?.url?.includes('/auth/login') ||
      original?.url?.includes('/auth/register') ||
      original?.url?.includes('/auth/refresh');

    if (err.response?.status !== 401 || original._retry || isAuthEndpoint) {
      return Promise.reject(err);
    }

    if (_isRefreshing) {
      // Queue request until token refreshed
      return new Promise((resolve, reject) => _queue.push({ resolve, reject }))
        .then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        })
        .catch(Promise.reject.bind(Promise));
    }

    original._retry = true;
    _isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const token = data.data.accessToken;
      setAccessToken(token);
      drainQueue(null, token);
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch (refreshErr) {
      drainQueue(refreshErr, null);
      clearAccessToken();

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('vault_user');
        sessionStorage.removeItem('vault_session');
        sessionStorage.removeItem('vault_session_master_key');
        window.dispatchEvent(new Event('vault_auth_logout'));

        if (
          !window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register') &&
          !window.location.pathname.startsWith('/landing') &&
          window.location.pathname !== '/'
        ) {
          window.location.href = '/login';
        }
      }
      return Promise.reject(refreshErr);
    } finally {
      _isRefreshing = false;
    }
  }
);

export default api;
