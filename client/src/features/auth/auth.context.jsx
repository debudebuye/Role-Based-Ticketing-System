import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { authService } from './auth.service.js';
import { isTokenValid } from '../../shared/utils/tokenUtils.js';
import { tokenStore } from '../../shared/utils/api.js';
import { socketManager } from '../../shared/utils/socket.js';

export const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        user: action.payload.user, 
        token: action.payload.token,
        isAuthenticated: true,
        error: null 
      };
    case 'LOGIN_FAILURE':
      return { 
        ...state, 
        loading: false, 
        error: action.payload,
        isAuthenticated: false,
        user: null,
        token: null
      };
    case 'LOGOUT':
      return { 
        ...state, 
        user: null, 
        token: null, 
        isAuthenticated: false,
        loading: false,
        error: null
      };
    case 'UPDATE_USER':
      return { 
        ...state, 
        user: action.payload 
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const expiryTimerRef = useRef(null);

  // Schedule auto-logout when access token expires
  const scheduleExpiry = (token) => {
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    try {
      let base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      let decoded;
      if (typeof Buffer !== 'undefined') {
        decoded = Buffer.from(base64, 'base64').toString('utf-8');
      } else {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        decoded = new TextDecoder().decode(bytes);
      }
      const payload = JSON.parse(decoded);
      const msUntilExpiry = payload.exp * 1000 - Date.now();
      if (msUntilExpiry > 0) {
        expiryTimerRef.current = setTimeout(() => {
          authService.logout();
          dispatch({ type: 'LOGOUT' });
        }, msUntilExpiry);
      }
    } catch { /* ignore parse errors */ }
  };

  // Keep the socket in sync with the auth token.
  // Fires whenever the token changes (login, logout, silent refresh).
  useEffect(() => {
    if (state.token) {
      socketManager.connect(state.token);
    } else {
      socketManager.disconnect();
    }
  }, [state.token]);

  // Initialize auth state — if user is in localStorage but token is in-memory
  // (cleared on reload), trigger a silent refresh so the API interceptor
  // restores both the token and the socket connection.
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      // Try to restore with whatever token is in memory (will be null on reload)
      const token = tokenStore.getAccess();
      if (token && isTokenValid(token)) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
        scheduleExpiry(token);
      } else {
        // No valid in-memory token — attempt silent refresh via the HttpOnly cookie.
        // The api.js interceptor will call /auth/refresh automatically on the
        // first 401, so we fire a lightweight authenticated request to trigger it.
        import('../../shared/utils/api.js').then(({ default: api }) => {
          api.get('/auth/profile')
            .then(res => {
              const freshToken = tokenStore.getAccess();
              const freshUser  = res.data?.data?.user || user;
              if (freshToken) {
                dispatch({ type: 'LOGIN_SUCCESS', payload: { user: freshUser, token: freshToken } });
                localStorage.setItem('user', JSON.stringify(freshUser));
                scheduleExpiry(freshToken);
              }
            })
            .catch(() => {
              // Refresh failed (cookie expired or missing) — clear stale user data
              localStorage.removeItem('user');
              dispatch({ type: 'LOGOUT' });
            });
        });
      }
    }

    return () => {
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    };
  }, []);

  const login = async (credentials) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const result = await authService.login(credentials);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: result.user, token: result.accessToken } });
      scheduleExpiry(result.accessToken);
      // socket connects automatically via the useEffect watching state.token
      return result;
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: error.response?.data?.message || 'Login failed' });
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const result = await authService.register(userData);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: result.user, token: result.accessToken } });
      scheduleExpiry(result.accessToken);
      // socket connects automatically via the useEffect watching state.token
      return result;
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: error.response?.data?.message || 'Registration failed' });
      throw error;
    }
  };

  const logout = () => {
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    // socket disconnects automatically via the useEffect watching state.token
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (user) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};