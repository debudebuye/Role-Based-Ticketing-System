import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';
import { useNavigate } from 'react-router-dom';
import { FaTicketAlt, FaSignOutAlt, FaSync, FaFilter } from 'react-icons/fa';

const AdminDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false); // State for logout modal
  const [filterStatus, setFilterStatus] = useState('All'); // State for filtering tickets
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Define the API base URL
  const API_BASE_URL = process.env.REACT_APP_BACKEND_BASEURL || "http://localhost:5000";

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess(''); // Clear success message before fetching
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(response.data);
    } catch (error) {
      setError('Error fetching tickets. Please try again.');
      setTimeout(() => setError(''), 3000); // Clear error after 3 seconds
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE_URL]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Update ticket status
  const handleUpdateStatus = async (ticketId, status) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.put(
        `${API_BASE_URL}/api/tickets/${ticketId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Ticket status updated successfully!');
      fetchTickets(); // Refresh the ticket list
    } catch (error) {
      setError('Error updating ticket status. Please try again.');
      setTimeout(() => setError(''), 3000); // Clear error after 3 seconds
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000); // Clear success after 3 seconds
    }
  };

  // Handle logout
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Filter tickets by status
  const filteredTickets = tickets.filter((ticket) => {
    if (filterStatus === 'All') return true;
    return ticket.status === filterStatus;
  });

  return (
    <div className="min-h-screen bg-purple-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-purple-800 flex items-center">
            <FaTicketAlt className="mr-2" /> Admin Dashboard
          </h2>
          <button
            onClick={() => setShowLogoutModal(true)} // Open logout modal
            className="bg-red-500 text-white p-2 rounded hover:bg-red-600 flex items-center"
          >
            <FaSignOutAlt className="mr-2" /> Logout
          </button>
        </div>

        {/* Display error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Display success message */}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-purple-800 flex items-center">
              <FaTicketAlt className="mr-2" /> All Tickets
            </h3>
            <div className="flex items-center space-x-4">
              {/* Filter dropdown */}
              <div className="flex items-center">
                <FaFilter className="mr-2 text-purple-800" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="All">All</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <button
                onClick={fetchTickets}
                disabled={loading}
                className="bg-purple-600 text-white p-2 rounded hover:bg-purple-700 flex items-center disabled:bg-purple-300"
              >
                <FaSync className="mr-2" /> Refresh
              </button>
            </div>
          </div>
          {loading ? (
            <p className="text-gray-600">Loading tickets...</p>
          ) : (
            <ul>
              {filteredTickets.map((ticket) => (
                <li key={ticket._id} className="mb-4 p-4 border rounded-lg shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <strong className="text-lg text-purple-800">{ticket.title}</strong>
                      <p className="text-gray-600">{ticket.description}</p>
                    </div>
                    <div className="flex items-center">
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
                      <select
                        value={ticket.status}
                        onChange={(e) => handleUpdateStatus(ticket._id, e.target.value)}
                        className="ml-4 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
                onClick={() => setShowLogoutModal(false)} // Close modal
                className="bg-gray-300 text-gray-800 p-2 rounded hover:bg-gray-400 transition duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout} // Confirm logout
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

export default AdminDashboard;