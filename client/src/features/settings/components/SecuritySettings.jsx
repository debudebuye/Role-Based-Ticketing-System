import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { validatePassword } from '../../../shared/utils/passwordValidation.js';
import PasswordStrengthIndicator from '../../../shared/components/PasswordStrengthIndicator.jsx';

const SecuritySettings = ({ user }) => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const newPassword = watch('newPassword');

  const changePasswordMutation = useMutation({
    mutationFn: (data) => {
      // TODO: Implement password change API call
      return Promise.resolve(data);
    },
    onSuccess: () => {
      toast.success('Password changed successfully!');
    },
    onError: () => {
      toast.error('Failed to change password');
    }
  });

  const onSubmit = (data) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage your password and security preferences
        </p>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <input
              type="password"
              {...register('currentPassword', { required: 'Current password is required' })}
              className="input"
              placeholder="Enter your current password"
            />
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              {...register('newPassword', {
                required: 'New password is required',
                validate: (value) => {
                  const errors = validatePassword(value);
                  return errors.length === 0 || errors[0];
                }
              })}
              className="input"
              placeholder="Enter your new password"
            />
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
            )}
            <PasswordStrengthIndicator password={newPassword} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: value => value === newPassword || 'Passwords do not match'
              })}
              className="input"
              placeholder="Confirm your new password"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Password Requirements:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• At least 8 characters long</li>
              <li>• Include uppercase and lowercase letters</li>
              <li>• Include at least one number</li>
              <li>• Include at least one special character (@$!%*?&)</li>
              <li>• Avoid common passwords and sequential characters</li>
            </ul>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="btn btn-primary"
            >
              {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SecuritySettings;