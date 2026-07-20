import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, User } from 'lucide-react';
import { userService } from '../../users/user.service.js';
import { getInitials } from '../../../shared/utils/helpers.js';

const AssignTicketModal = ({ isOpen, onClose, ticket, onAssign, isLoading }) => {
  const [selectedAgent, setSelectedAgent] = useState(ticket?.assignedTo?._id || '');

  // Fetch agents
  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => userService.getAgents(),
    enabled: isOpen
  });

  useEffect(() => {
    if (ticket?.assignedTo?._id) {
      setSelectedAgent(ticket.assignedTo._id);
    } else {
      setSelectedAgent('');
    }
  }, [ticket]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAssign(selectedAgent || null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Assign Ticket</h2>
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
              Currently Assigned To: {' '}
              <span className="font-semibold">
                {ticket?.assignedTo?.name || 'Unassigned'}
              </span>
            </label>
            
            {agentsLoading ? (
              <div className="animate-pulse">
                <div className="h-10 bg-gray-300 rounded"></div>
              </div>
            ) : (
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="input w-full"
              >
                <option value="">Unassigned</option>
                {agents?.map((agent) => (
                  <option key={agent._id} value={agent._id}>
                    {agent.name} ({agent.email}) - {agent.department}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Show selected agent info */}
          {selectedAgent && agents && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              {(() => {
                const agent = agents.find(a => a._id === selectedAgent);
                return agent ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-medium text-sm">
                        {getInitials(agent.name)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{agent.name}</p>
                      <p className="text-sm text-gray-600">{agent.email}</p>
                      <p className="text-sm text-gray-600">{agent.department}</p>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          <div className="flex items-center space-x-3">
            <button
              type="submit"
              disabled={isLoading || agentsLoading}
              className="btn btn-primary flex-1"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Assigning...
                </div>
              ) : (
                'Assign Ticket'
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

export default AssignTicketModal;