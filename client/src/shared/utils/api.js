import axios from 'axios';
import toast from 'react-hot-toast';
import { isTokenValid } from './tokenUtils.js';

// ── Fail fast if VITE_API_URL is not set in production ────────────────────────
const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL && import.meta.env.PROD) {
  throw new Error(
    '[api] VITE_API_URL is not defined. Set it in your production environment before building.'
  );
}
const BASE_URL = API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  // Required so the browser sends the HttpOnly refresh-token cookie
  // on same-origin requests and on cross-origin requests to the API.
  withCredentials: true
});

// ── Access token storage (in-memory only) ────────────────────────────────────
// Storing the access token in localStorage exposes it to any JS on the page
// (XSS). We keep it in a module-level closure instead — it lives only in
// memory and is never readable by third-party scripts.
// On a hard page reload the token is gone, but the silent-refresh flow
// (HttpOnly refresh-token cookie → POST /auth/refresh) restores it
// automatically before the first protected request fires.
let _accessToken = null;

export const tokenStore = {
  getAccess:   ()    => _accessToken,
  setAccess:   (a)   => { _accessToken = a; },
  clearAccess: ()    => {
    _accessToken = null;
    localStorage.removeItem('user');
  },
  // Kept for backward-compat call sites
  setTokens:   (a)   => { _accessToken = a; },
  clearTokens: ()    => {
    _accessToken = null;
    localStorage.removeItem('user');
  }
};

// ── Refresh lock (prevents parallel refresh calls) ────────────────────────────
let _refreshing = null;

const doRefresh = async () => {
  // No token needed in the request body — the browser sends the HttpOnly
  // cookie automatically because withCredentials: true is set above.
  const res = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
  const { accessToken } = res.data.data;
  tokenStore.setAccess(accessToken);

  // Re-connect the socket with the new token so the active-users list stays
  // accurate after a silent refresh (e.g. on page reload).
  // Dynamic import avoids a circular dependency — socket imports api,
  // api would import socket → break. Lazy import sidesteps that.
  import('./socket.js').then(({ socketManager }) => {
    socketManager.connect(accessToken);
  }).catch(() => {});

  return accessToken;
};

// ── Request interceptor ───────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token && isTokenValid(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor ──────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        // Serialize parallel refresh calls into one
        if (!_refreshing) _refreshing = doRefresh().finally(() => { _refreshing = null; });
        const newToken = await _refreshing;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        tokenStore.clearTokens();
        if (window.location.pathname !== '/login') window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    const message = error.response?.data?.message || 'An error occurred';

    // Only show a 403 toast for unexpected permission errors.
    // Known 403s (like a manager hitting an admin-only endpoint) are handled
    // gracefully by the component — don't spam the user with toasts.
    if (error.response?.status === 403) {
      // Suppress toasts for monitoring endpoints hit by non-admin roles —
      // the component shows an appropriate empty/error state instead.
      const url = error.config?.url ?? '';
      const isSilent403 = url.includes('/monitoring/');
      if (!isSilent403) {
        toast.error('Access denied. Insufficient permissions.');
      }
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.response?.status >= 400 && error.response?.status !== 401) {
      toast.error(message);
    } else if (error.code === 'ERR_NETWORK') {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

export default api;
