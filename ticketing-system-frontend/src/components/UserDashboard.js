import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';
import { useNavigate } from 'react-router-dom';
import { FaTicketAlt, FaSignOutAlt, FaPlus } from 'react-icons/fa';

const UserDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { token, user } = useSelector((state) => state.auth); // Get user from state
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_BASEURL || "http://localhost:5000"}/api/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(response.data);
    } catch (error) {
      setError('Error fetching tickets. Please try again.');
      setTimeout(() => setError(''), 3000); // Clear error after 3 seconds
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Handle ticket creation
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_BASEURL || "http://localhost:5000"}/api/tickets`,
        { title, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Ticket created successfully!');
      setTimeout(() => setSuccess(''), 3000); // Clear success after 3 seconds
      setTitle('');
      setDescription('');
      fetchTickets();
    } catch (error) {
      setError('Error creating ticket. Please try again.');
      setTimeout(() => setError(''), 3000); // Clear error after 3 seconds
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center">
            <FaTicketAlt className="mr-2" /> User Dashboard
          </h2>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="bg-red-500 text-white p-2 rounded hover:bg-red-600 flex items-center transition duration-300"
          >
            <FaSignOutAlt className="mr-2" /> Logout
          </button>
        </div>
        {/* Display error message for 3 seconds */}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {/* Display success message for 3 seconds */}
        {success && <p className="text-green-500 mb-4">{success}</p>}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Create Ticket Form */}
          <div className="bg-white p-6 rounded-lg shadow-lg md:w-1/3">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4 mt-5">
              <FaPlus className="mr-2" /> Create New Ticket
            </h3>
            <form onSubmit={handleCreateTicket}>
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 mt-12 "
                required
              />
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-700 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-purple-300 transition duration-300"
              >
                <FaPlus className="mr-2" /> {loading ? 'Creating Ticket...' : 'Create Ticket'}
              </button>
            </form>
          </div>

          {/* Ticket List */}
          <div className="bg-white p-6 rounded-lg shadow-lg md:w-2/3 overflow-y-auto max-h-[calc(100vh-200px)]">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
              <FaTicketAlt className="mr-2" /> Your Tickets
            </h3>
            {loading ? (
              <p className="text-gray-600">Loading tickets...</p>
            ) : (
              <ul className="space-y-4">
                {tickets.map((ticket) => (
                  <li key={ticket._id} className="p-4 border rounded-lg shadow-sm hover:shadow-md transition duration-300">
                    <div className="flex justify-between items-center">
                      <div>
                        <strong className="text-lg text-gray-800">{ticket.title}</strong>
                        <p className="text-gray-600">{ticket.description}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-sm font-semibold ${
                          ticket.status === 'Open'
                            ? 'bg-blue-100 text-blue-800'
                            : ticket.status === 'In Progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="bg-gray-300 text-gray-800 p-2 rounded hover:bg-gray-400 transition duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition duration-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;