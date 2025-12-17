import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from './auth.service.js';
import { isTokenValid } from '../../shared/utils/tokenUtils.js';

const AuthContext = createContext();

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

  // Initialize auth state from localStorage
  useEffect(() => {
    try {
      const token = authService.getToken();
      const user = authService.getCurrentUser();
      
      if (token && user && isTokenValid(token)) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token }
        });
      } else if (token) {
        // Token exists but is invalid - clear it
        console.warn('Invalid or expired token found, clearing auth data');
        authService.logout();
      }
    } catch (error) {
      console.error('Error initializing auth state:', error);
      // Clear invalid data
      authService.logout();
    }
  }, []);

  const login = async (credentials) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const result = await authService.login(credentials);
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: result 
      });
      return result;
    } catch (error) {
      dispatch({ 
        type: 'LOGIN_FAILURE', 
        payload: error.response?.data?.message || 'Login failed' 
      });
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const result = await authService.register(userData);
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: result 
      });
      return result;
    } catch (error) {
      dispatch({ 
        type: 'LOGIN_FAILURE', 
        payload: error.response?.data?.message || 'Registration failed' 
      });
      throw error;
    }
  };

  const logout = () => {
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