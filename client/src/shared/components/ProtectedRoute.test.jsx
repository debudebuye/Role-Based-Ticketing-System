import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockUseAuth = vi.hoisted(() =>
  vi.fn(() => ({ isAuthenticated: false, user: null, loading: false }))
);

vi.mock('../../features/auth/auth.context.jsx', () => ({
  AuthContext: { Provider: ({ children }) => children },
  useAuth: mockUseAuth,
}));

import ProtectedRoute from './ProtectedRoute';

describe('ProtectedRoute', () => {
  it('shows loading spinner while loading', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null, loading: true });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(document.querySelector('.animate-spin')).toBeTruthy();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null, loading: false });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated with no role restriction', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'customer' }, loading: false });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('renders children when user has allowed role', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'admin' }, loading: false });

    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['admin', 'manager']}>
          <div>Admin content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });

  it('shows access denied when user role is not allowed', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'customer' }, loading: false });

    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['admin']}>
          <div>Admin content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
  });
});
