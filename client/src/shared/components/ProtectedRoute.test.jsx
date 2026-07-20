import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { AuthContext } from '../../features/auth/auth.context.jsx';

function renderWithAuth(ui, authValue) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue}>
        {ui}
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('shows loading spinner while loading', () => {
    renderWithAuth(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>,
      { isAuthenticated: false, user: null, loading: true }
    );

    expect(screen.getByRole('status')).toBeDefined();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    renderWithAuth(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>,
      { isAuthenticated: false, user: null, loading: false }
    );

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated with no role restriction', () => {
    renderWithAuth(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>,
      { isAuthenticated: true, user: { role: 'customer' }, loading: false }
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('renders children when user has allowed role', () => {
    renderWithAuth(
      <ProtectedRoute allowedRoles={['admin', 'manager']}>
        <div>Admin content</div>
      </ProtectedRoute>,
      { isAuthenticated: true, user: { role: 'admin' }, loading: false }
    );

    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });

  it('shows access denied when user role is not allowed', () => {
    renderWithAuth(
      <ProtectedRoute allowedRoles={['admin']}>
        <div>Admin content</div>
      </ProtectedRoute>,
      { isAuthenticated: true, user: { role: 'customer' }, loading: false }
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
  });
});
