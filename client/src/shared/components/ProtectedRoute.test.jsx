import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../shared/utils/socket.js', () => ({
  socketManager: { connect: vi.fn(), disconnect: vi.fn(), getSocket: vi.fn(() => null) },
}));
vi.mock('../../shared/utils/api.js', () => ({
  tokenStore: { getAccess: vi.fn(() => null), setAccess: vi.fn() },
  default: { get: vi.fn(), post: vi.fn() },
}));
vi.mock('../../features/auth/auth.service.js', () => ({
  authService: { getCurrentUser: vi.fn(() => null), logout: vi.fn() },
}));

import { AuthContext } from '../../features/auth/auth.context.jsx';
import ProtectedRoute from './ProtectedRoute';

const renderWithAuth = (ui, { authValue } = {}) => {
  const defaultAuth = {
    isAuthenticated: false,
    user: null,
    loading: false,
    ...authValue,
  };
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={defaultAuth}>{ui}</AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  it('shows loading spinner while loading', () => {
    renderWithAuth(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>,
      { authValue: { loading: true } }
    );

    expect(document.querySelector('.animate-spin')).toBeTruthy();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    const { container } = renderWithAuth(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(container.querySelector('[to="/login"]')).toBeTruthy();
  });

  it('renders children when authenticated with no role restriction', () => {
    renderWithAuth(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>,
      { authValue: { isAuthenticated: true, user: { role: 'customer' } } }
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('renders children when user has allowed role', () => {
    renderWithAuth(
      <ProtectedRoute allowedRoles={['admin', 'manager']}>
        <div>Admin content</div>
      </ProtectedRoute>,
      { authValue: { isAuthenticated: true, user: { role: 'admin' } } }
    );

    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });

  it('shows access denied when user role is not allowed', () => {
    renderWithAuth(
      <ProtectedRoute allowedRoles={['admin']}>
        <div>Admin content</div>
      </ProtectedRoute>,
      { authValue: { isAuthenticated: true, user: { role: 'customer' } } }
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
  });
});
