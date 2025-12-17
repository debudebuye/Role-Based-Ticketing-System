import React from 'react';
import { useAuth } from '../../features/auth/auth.context.jsx';

const DebugInfo = () => {
  const { user, isAuthenticated, token } = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs max-w-sm">
      <h4 className="font-bold mb-2">Debug Info</h4>
      <div>
        <strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}
      </div>
      <div>
        <strong>User:</strong> {user ? user.name : 'None'}
      </div>
      <div>
        <strong>Role:</strong> {user ? user.role : 'None'}
      </div>
      <div>
        <strong>Token:</strong> {token ? 'Present' : 'Missing'}
      </div>
    </div>
  );
};

export default DebugInfo;