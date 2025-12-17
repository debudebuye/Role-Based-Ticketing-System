import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const ProfileSettings = ({ user }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name || '',
      department: user?.department || '',
      phone: user?.phone || ''
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => {
      // TODO: Implement profile update API call
      return Promise.resolve(data);
    },
    onSuccess: () => {
      toast.success('Profile updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update profile');
    }
  });

  const onSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
        <p className="text-sm text-gray-600 mt-1">
          Update your account profile information
        </p>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                {...register('name', { required: 'Name is required' })}
                className="input"
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                className="input bg-gray-50"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <input
                type="text"
                {...register('department')}
                className="input"
                placeholder="Enter your department"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                {...register('phone')}
                className="input"
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <input
              type="text"
              value={user?.role || ''}
              className="input bg-gray-50"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">
              Role is managed by administrators
            </p>
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
              disabled={updateProfileMutation.isPending}
              className="btn btn-primary"
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;