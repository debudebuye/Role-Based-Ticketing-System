/**
 * Token validation and management utilities
 */

/**
 * Check if a JWT token is expired
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error parsing token:', error);
    return true;
  }
};

/**
 * Get token expiration time
 */
export const getTokenExpiration = (token) => {
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return new Date(payload.exp * 1000);
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
};

/**
 * Check if token is valid (exists and not expired)
 */
export const isTokenValid = (token) => {
  return token && !isTokenExpired(token);
};

/**
 * Clear invalid tokens from localStorage
 */
export const clearInvalidTokens = () => {
  const token = localStorage.getItem('token');
  if (token && isTokenExpired(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return true; // Token was cleared
  }
  return false; // Token is still valid or doesn't exist
};