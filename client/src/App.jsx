import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/auth.context.jsx';
import ProtectedRoute from './shared/components/ProtectedRoute.jsx';
import Layout from './shared/components/Layout.jsx';
import ErrorBoundary from './shared/components/ErrorBoundary.jsx';

// Public pages — loaded eagerly (small, always needed)
import LandingPage  from './pages/LandingPage.jsx';
import LoginPage    from './features/auth/pages/LoginPage.jsx';
import RegisterPage from './features/auth/pages/RegisterPage.jsx';

// App pages — lazy-loaded so each route becomes its own chunk
const AdminDashboard    = lazy(() => import('./features/dashboard/admin/AdminDashboard.jsx'));
const ManagerDashboard  = lazy(() => import('./features/dashboard/manager/ManagerDashboard.jsx'));
const AgentDashboard    = lazy(() => import('./features/dashboard/agent/AgentDashboard.jsx'));
const CustomerDashboard = lazy(() => import('./features/dashboard/customer/CustomerDashboard.jsx'));
const TicketRouter      = lazy(() => import('./features/tickets/TicketRouter.jsx'));
const TicketDetailPage  = lazy(() => import('./features/tickets/pages/TicketDetailPage.jsx'));
const CreateTicketPage  = lazy(() => import('./features/tickets/pages/CreateTicketPage.jsx'));
const UserListPage      = lazy(() => import('./features/users/pages/UserListPage.jsx'));
const SettingsPage      = lazy(() => import('./features/settings/pages/SettingsPage.jsx'));
const MonitoringPage    = lazy(() => import('./features/monitoring/MonitoringPage.jsx'));

import { ROLES } from './shared/utils/constants.js';

// Minimal fallback shown during chunk load
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          
          {/* Protected routes */}
          <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            {/* Dashboard routes */}
            <Route path="dashboard" element={<ErrorBoundary key="dashboard"><Suspense fallback={<PageLoader />}><DashboardRouter /></Suspense></ErrorBoundary>} />
            
            {/* Ticket routes */}
            <Route path="tickets" element={<ErrorBoundary key="tickets"><Suspense fallback={<PageLoader />}><TicketRouter /></Suspense></ErrorBoundary>} />
            <Route path="tickets/new" element={<ErrorBoundary key="tickets-new"><Suspense fallback={<PageLoader />}><CreateTicketPage /></Suspense></ErrorBoundary>} />
            <Route path="tickets/:id" element={<ErrorBoundary key="ticket-detail"><Suspense fallback={<PageLoader />}><TicketDetailPage /></Suspense></ErrorBoundary>} />
            
            {/* User management routes (Admin/Manager only) */}
            <Route 
              path="users" 
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                  <Suspense fallback={<PageLoader />}><UserListPage /></Suspense>
                </ProtectedRoute>
              } 
            />
            
            {/* Settings route */}
            <Route path="settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />

            {/* Monitoring — admin only */}
            <Route
              path="monitoring"
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                  <ErrorBoundary key="monitoring">
                    <Suspense fallback={<PageLoader />}><MonitoringPage /></Suspense>
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            
            {/* Default redirect */}
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
}

// Dashboard router based on user role
const DashboardRouter = () => {
  const { user } = useAuth();
  
  if (!user) return null;
  
  switch (user.role) {
    case ROLES.ADMIN:
      return <AdminDashboard />;
    case ROLES.MANAGER:
      return <ManagerDashboard />;
    case ROLES.AGENT:
      return <AgentDashboard />;
    case ROLES.CUSTOMER:
      return <CustomerDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

// Public route component (redirects to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }
  
  return children;
};

export default App;