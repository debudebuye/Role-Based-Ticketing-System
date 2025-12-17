import React, { useState } from 'react';
import { Plus, Search, Filter, Users, Edit, Trash2, Mail, Phone, Calendar, Shield } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../../auth/auth.context.jsx';
import { userService } from '../user.service.js';
import { formatDate, debounce } from '../../../shared/utils/helpers.js';
import { ROLES } from '../../../shared/utils/constants.js';
import CreateUserModal from '../components/CreateUserModal.jsx';
import EditUserModal from '../components/EditUserModal.jsx';
import DeleteUserModal from '../components/DeleteUserModal.jsx';

const UserListPage = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10
  });

  // Fetch users
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users', { ...filters, search: searchTerm, role: roleFilter, status: statusFilter }],
    queryFn: () => userService.getAllUsers({
      ...filters,
      search: searchTerm || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined
    }),
    refetchInterval: 30000
  });

  const users = usersData?.users || [];
  const pagination = usersData?.pagination || {};

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId) => userService.deleteUser(userId),
    onSuccess: () => {
      toast.success('User deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeletingUser(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  });

  // Debounced search
  const debouncedSearch = debounce((value) => {
    setSearchTerm(value);
    setFilters(prev => ({ ...prev, page: 1 }));
  }, 500);

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  const handleFilterChange = (key, value) => {
    if (key === 'role') setRoleFilter(value);
    if (key === 'status') setStatusFilter(value);
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const handleDeleteUser = (user) => {
    setDeletingUser(user);
  };

  const confirmDeleteUser = () => {
    if (deletingUser) {
      deleteUserMutation.mutate(deletingUser._id);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'badge-danger';
      case ROLES.MANAGER:
        return 'badge-warning';
      case ROLES.AGENT:
        return 'badge-primary';
      case ROLES.CUSTOMER:
        return 'badge-success';
      default:
        return 'badge-gray';
    }
  };

  const getStatusBadgeColor = (isActive) => {
    return isActive ? 'badge-success' : 'badge-gray';
  };

  // Permission check functions
  const canCreateUser = () => {
    return currentUser?.role === ROLES.ADMIN || currentUser?.role === ROLES.MANAGER;
  };

  const canEditUser = (user) => {
    if (currentUser?.role === ROLES.ADMIN) {
      return true; // Admins can edit anyone
    }
    if (currentUser?.role === ROLES.MANAGER) {
      // Managers can only edit agents and customers
      return user.role === ROLES.AGENT || user.role === ROLES.CUSTOMER;
    }
    return false;
  };

  const canDeleteUser = (user) => {
    if (currentUser?.role === ROLES.ADMIN) {
      return true; // Admins can delete anyone
    }
    if (currentUser?.role === ROLES.MANAGER) {
      // Managers can only delete agents and customers
      return user.role === ROLES.AGENT || user.role === ROLES.CUSTOMER;
    }
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">
            {currentUser?.role === ROLES.ADMIN 
              ? 'Manage all system users and their roles' 
              : currentUser?.role === ROLES.MANAGER
              ? 'Manage agents and customers'
              : 'View system users and their information'
            }
          </p>
        </div>
        {canCreateUser() && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </button>
        )}
      </div>

      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  className="input pl-10"
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={roleFilter}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="input"
              >
                <option value="">All Roles</option>
                {currentUser?.role === ROLES.ADMIN && (
                  <>
                    <option value={ROLES.ADMIN}>Admin</option>
                    <option value={ROLES.MANAGER}>Manager</option>
                  </>
                )}
                <option value={ROLES.AGENT}>Agent</option>
                <option value={ROLES.CUSTOMER}>Customer</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-32"></div>
                        <div className="h-3 bg-gray-300 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-8 bg-gray-300 rounded w-16"></div>
                      <div className="h-8 bg-gray-300 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading users</h3>
              <p className="text-gray-600 mb-4">{error.message}</p>
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-medium text-lg">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                          <span className={`badge ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                          <span className={`badge ${getStatusBadgeColor(user.isActive)}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-1" />
                              {user.phone}
                            </div>
                          )}
                          {user.department && (
                            <div className="flex items-center">
                              <Shield className="h-4 w-4 mr-1" />
                              {user.department}
                            </div>
                          )}
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Joined {formatDate(user.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {canEditUser(user) && (
                        <button
                          onClick={() => setEditingUser(user)}
                          className="btn btn-secondary text-sm px-3 py-1 flex items-center"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </button>
                      )}
                      {canDeleteUser(user) && (
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="btn btn-danger text-sm px-3 py-1 flex items-center"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </button>
                      )}
                      {!canEditUser(user) && !canDeleteUser(user) && (
                        <span className="text-sm text-gray-500 px-3 py-1">
                          View Only
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page <= 1}
                      className="btn btn-secondary text-sm px-3 py-1 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page >= pagination.pages}
                      className="btn btn-secondary text-sm px-3 py-1 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || roleFilter || statusFilter 
                  ? 'Try adjusting your search terms or filters.' 
                  : 'Start by adding your first user.'
                }
              </p>
              {canCreateUser() && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary"
                >
                  Add User
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals - Only show for admins */}
      {canCreateUser() && (
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingUser && canEditUser(editingUser) && (
        <EditUserModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          user={editingUser}
        />
      )}

      {deletingUser && canDeleteUser(deletingUser) && (
        <DeleteUserModal
          isOpen={!!deletingUser}
          onClose={() => setDeletingUser(null)}
          user={deletingUser}
          onConfirm={confirmDeleteUser}
          isLoading={deleteUserMutation.isPending}
        />
      )}
    </div>
  );
};

export default UserListPage;