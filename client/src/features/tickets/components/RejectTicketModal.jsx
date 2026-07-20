import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const RejectTicketModal = ({ isOpen, onClose, ticket, onReject, isLoading }) => {
  const [reason, setReason] = useState('');
  const [selectedReason, setSelectedReason] = useState('');

  const commonReasons = [
    'Workload too high - cannot take on additional tickets',
    'Lack of expertise in this area',
    'Currently working on higher priority tickets',
    'Insufficient information provided',
    'Requires specialized knowledge I don\'t have',
    'Technical complexity beyond my current skill level',
    'Time constraints - cannot meet expected deadline',
    'Other (please specify below)'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalReason = selectedReason === 'Other (please specify below)' ? reason : selectedReason;
    
    if (!finalReason.trim()) {
      return;
    }
    
    onReject(finalReason);
  };

  const handleReasonSelect = (selectedValue) => {
    setSelectedReason(selectedValue);
    if (selectedValue !== 'Other (please specify below)') {
      setReason('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Reject Ticket Assignment</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-orange-50 rounded-lg">
          <p className="text-sm text-orange-800">
            <strong>Note:</strong> Rejecting tickets may impact your performance metrics. 
            Please provide a clear reason to help improve future assignments.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ticket: <span className="font-normal">{ticket?.title}</span>
            </label>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for rejection *
            </label>
            <select
              value={selectedReason}
              onChange={(e) => handleReasonSelect(e.target.value)}
              className="input w-full mb-3"
              required
            >
              <option value="">Select a reason...</option>
              {commonReasons.map((reasonOption, index) => (
                <option key={index} value={reasonOption}>
                  {reasonOption}
                </option>
              ))}
            </select>

            {selectedReason === 'Other (please specify below)' && (
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="input resize-none w-full"
                placeholder="Please provide a detailed reason..."
                required
              />
            )}
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-1">What happens next:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Ticket will be unassigned and returned to the pool</li>
              <li>• Manager will be notified of the rejection</li>
              <li>• Reason will be recorded for performance review</li>
              <li>• Ticket may be reassigned to another agent</li>
            </ul>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="submit"
              disabled={isLoading || (!selectedReason || (selectedReason === 'Other (please specify below)' && !reason.trim()))}
              className="btn btn-danger flex-1"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Rejecting...
                </div>
              ) : (
                'Reject Ticket'
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

export default RejectTicketModal;