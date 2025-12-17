import { useState } from 'react';
import { X } from 'lucide-react';
import { STATUS_LABELS } from '../../../shared/utils/constants.js';

const AgentStatusModal = ({ isOpen, onClose, ticket, onUpdate, isLoading }) => {
  const [selectedStatus, setSelectedStatus] = useState(ticket?.status || 'open');

  // Agents can only change status in a specific workflow
  const getAvailableStatuses = () => {
    const currentStatus = ticket?.status;
    
    switch (currentStatus) {
      case 'open':
        return [
          { value: 'open', label: 'Open' },
          { value: 'in_progress', label: 'In Progress' }
        ];
      case 'in_progress':
        return [
          { value: 'in_progress', label: 'In Progress' },
          { value: 'resolved', label: 'Resolved' }
        ];
      case 'resolved':
        return [
          { value: 'resolved', label: 'Resolved' },
          { value: 'closed', label: 'Closed' }
        ];
      case 'closed':
        return [
          { value: 'closed', label: 'Closed' }
        ];
      default:
        return [
          { value: 'open', label: 'Open' },
          { value: 'in_progress', label: 'In Progress' }
        ];
    }
  };

  const statusOptions = getAvailableStatuses();

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({ status: selectedStatus });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Update Ticket Status</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Status: <span className="font-semibold">{STATUS_LABELS[ticket?.status]}</span>
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input w-full"
              required
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            {statusOptions.length === 1 && (
              <p className="mt-2 text-sm text-gray-500">
                This ticket cannot be changed from its current status.
              </p>
            )}
          </div>

          {/* Status change guidance */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-1">Status Guidelines:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>In Progress:</strong> You're actively working on this ticket</li>
              <li>• <strong>Resolved:</strong> Issue is fixed and ready for customer review</li>
              <li>• <strong>Closed:</strong> Ticket is completely finished</li>
            </ul>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="submit"
              disabled={isLoading || selectedStatus === ticket?.status || statusOptions.length === 1}
              className="btn btn-primary flex-1"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </div>
              ) : (
                'Update Status'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
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

export default AgentStatusModal;