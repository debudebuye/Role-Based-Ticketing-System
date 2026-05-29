import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/auth.context.jsx';
import ProtectedRoute from './shared/components/ProtectedRoute.jsx';
import Layout from './shared/components/Layout.jsx';
import ErrorBoundary from './shared/components/ErrorBoundary.jsx';

// Public pages
import LandingPage from './pages/LandingPage.jsx';

// Auth pages
import LoginPage from './features/auth/pages/LoginPage.jsx';
import RegisterPage from './features/auth/pages/RegisterPage.jsx';

// Dashboard pages
import AdminDashboard from './features/dashboard/admin/AdminDashboard.jsx';
import ManagerDashboard from './features/dashboard/manager/ManagerDashboard.jsx';
import AgentDashboard from './features/dashboard/agent/AgentDashboard.jsx';
import CustomerDashboard from './features/dashboard/customer/CustomerDashboard.jsx';

// Feature pages
import TicketRouter from './features/tickets/TicketRouter.jsx';
import TicketDetailPage from './features/tickets/pages/TicketDetailPage.jsx';
import CreateTicketPage from './features/tickets/pages/CreateTicketPage.jsx';
import UserListPage from './features/users/pages/UserListPage.jsx';
import SettingsPage from './features/settings/pages/SettingsPage.jsx';

import { ROLES } from './shared/utils/constants.js';

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
            <Route path="dashboard" element={<ErrorBoundary key="dashboard"><DashboardRouter /></ErrorBoundary>} />
            
            {/* Ticket routes */}
            <Route path="tickets" element={<ErrorBoundary key="tickets"><TicketRouter /></ErrorBoundary>} />
            <Route path="tickets/new" element={<ErrorBoundary key="tickets-new"><CreateTicketPage /></ErrorBoundary>} />
            <Route path="tickets/:id" element={<ErrorBoundary key="ticket-detail"><TicketDetailPage /></ErrorBoundary>} />
            
            {/* User management routes (Admin/Manager only) */}
            <Route 
              path="users" 
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                  <UserListPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Settings route */}
            <Route path="settings" element={<SettingsPage />} />
            
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