import { useAuth } from '../../features/auth/auth.context.jsx';
import { isTokenValid, getTokenExpiration } from '../utils/tokenUtils.js';

const AuthDebug = () => {
  const { user, token, isAuthenticated } = useAuth();
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h4 className="font-bold mb-2">Auth Debug Info</h4>
      <div className="space-y-1">
        <div>Context Auth: {isAuthenticated ? '✅' : '❌'}</div>
        <div>Context User: {user?.name || 'None'}</div>
        <div>Context Token: {token ? '✅' : '❌'}</div>
        <div>Stored Token: {storedToken ? '✅' : '❌'}</div>
        <div>Stored User: {storedUser ? '✅' : '❌'}</div>
        <div>Token Valid: {storedToken && isTokenValid(storedToken) ? '✅' : '❌'}</div>
        {storedToken && (
          <div>Token Expires: {getTokenExpiration(storedToken)?.toLocaleString() || 'Invalid'}</div>
        )}
      </div>
    </div>
  );
};

export default AuthDebug;