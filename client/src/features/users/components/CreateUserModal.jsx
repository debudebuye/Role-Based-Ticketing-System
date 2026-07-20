import React from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../../auth/auth.context.jsx';
import { userService } from '../user.service.js';
import { ROLES } from '../../../shared/utils/constants.js';
import { validatePassword } from '../../../shared/utils/passwordValidation.js';
import PasswordStrengthIndicator from '../../../shared/components/PasswordStrengthIndicator.jsx';

const CreateUserModal = ({ isOpen, onClose }) => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  
  const password = watch('password');

  const createUserMutation = useMutation({
    mutationFn: (userData) => userService.createUser(userData),
    onSuccess: () => {
      toast.success('User created successfully!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      reset();
      onClose();
    },
    onError: (error) => {
      console.error('User creation error:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data?.errors) {
        // Show validation errors
        const errorMessages = error.response.data.errors.map(err => err.message).join(', ');
        toast.error(`Validation error: ${errorMessages}`);
      } else {
        toast.error(error.response?.data?.message || 'Failed to create user');
      }
    }
  });

  const onSubmit = (data) => {
    // Clean up empty strings
    const cleanData = {
      ...data,
      phone: data.phone?.trim() || undefined,
      department: data.department?.trim() || undefined
    };
    
    // Remove undefined values
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === undefined || cleanData[key] === '') {
        delete cleanData[key];
      }
    });
    
    console.log('Creating user with data:', cleanData);
    createUserMutation.mutate(cleanData);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Create New User</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              {...register('name', {
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters'
                }
              })}
              className="input w-full"
              placeholder="Enter full name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              className="input w-full"
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              {...register('password', {
                required: 'Password is required',
                validate: (value) => {
                  const errors = validatePassword(value);
                  return errors.length === 0 || errors[0];
                }
              })}
              className="input w-full"
              placeholder="Enter password"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
            <PasswordStrengthIndicator password={password} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              {...register('role', { required: 'Role is required' })}
              className="input w-full"
            >
              <option value="">Select a role</option>
              {currentUser?.role === ROLES.ADMIN && (
                <>
                  <option value={ROLES.ADMIN}>Admin</option>
                  <option value={ROLES.MANAGER}>Manager</option>
                </>
              )}
              <option value={ROLES.AGENT}>Agent</option>
              <option value={ROLES.CUSTOMER}>Customer</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              {...register('phone')}
              className="input w-full"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <input
              type="text"
              {...register('department')}
              className="input w-full"
              placeholder="Enter department"
            />
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <button
              type="submit"
              disabled={createUserMutation.isPending}
              className="btn btn-primary flex-1"
            >
              {createUserMutation.isPending ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </div>
              ) : (
                'Create User'
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;