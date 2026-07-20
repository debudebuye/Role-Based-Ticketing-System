import { useState } from 'react';
import { useAuth } from '../../features/auth/auth.context.jsx';

export const useLogoutConfirmation = () => {
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutConfirm(false);
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  return {
    showLogoutConfirm,
    handleLogoutClick,
    handleLogoutConfirm,
    handleLogoutCancel
  };
};