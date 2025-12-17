import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const DeleteUserModal = ({ isOpen, onClose, user, onConfirm, isLoading }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Delete User</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-700 mb-2">
            Are you sure you want to delete the following user?
          </p>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-600">Role: {user.role}</p>
          </div>
        </div>

        <div className="mb-4 p-3 bg-red-50 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>Warning:</strong> This action cannot be undone. All data associated with this user will be permanently deleted.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="btn btn-danger flex-1"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </div>
            ) : (
              'Delete User'
            )}
          </button>
          <button
            onClick={onClose}
            className="btn btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;