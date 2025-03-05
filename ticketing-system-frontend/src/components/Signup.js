import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Password validation rules
  const passwordRules = [
    { id: 1, text: 'At least 8 characters', regex: /.{8,}/ },
    { id: 2, text: 'At least one uppercase letter', regex: /[A-Z]/ },
    { id: 3, text: 'At least one lowercase letter', regex: /[a-z]/ },
    { id: 4, text: 'At least one number', regex: /[0-9]/ },
    { id: 5, text: 'At least one special character', regex: /[!@#$%^&*(),.?":{}|<>]/ },
  ];



  const API_BASE_URL = process.env.REACT_APP_BACKEND_BASEURL || "http://localhost:5000";


  // Check password against rules
  const validatePassword = (password) => {
    return passwordRules.map((rule) => ({
      ...rule,
      isValid: rule.regex.test(password),
    }));
  };

  const passwordValidation = validatePassword(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Check if all password rules are satisfied
    const isPasswordValid = passwordValidation.every((rule) => rule.isValid);
    if (!isPasswordValid) {
      setError('Password does not meet the requirements.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, { username, password, role });
      setSuccess('User registered successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000); // Redirect after 2 seconds
    } catch (error) {
      setError(error.response?.data?.message || 'Error during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-white-500 to-indigo-600">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Signup</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {success && <p className="text-green-500 text-center mb-4">{success}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <div className="mt-2">
              {passwordValidation.map((rule) => (
                <div
                  key={rule.id}
                  className={`text-sm ${rule.isValid ? 'text-green-500' : 'text-red-500'}`}
                >
                  {rule.isValid ? '✓' : '✗'} {rule.text}
                </div>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-purple-300"
          >
            {loading ? 'Signing up...' : 'Signup'}
          </button>
        </form>
        <p className="mt-4 text-center text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-purple-600 hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signup;