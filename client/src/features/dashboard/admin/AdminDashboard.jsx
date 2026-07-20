import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Ticket, TrendingUp, Settings, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/auth.context.jsx';
import { ticketService } from '../../tickets/ticket.service.js';
import { monitoringService } from '../../monitoring/monitoring.service.js';

const AdminDashboard = () => {
  const { user: _user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-ticket-stats'],
    queryFn:  ticketService.getTicketStats,
    refetchInterval: 30000,
  });

  const { data: sysStats, isLoading: sysLoading } = useQuery({
    queryKey: ['monitoring-stats'],
    queryFn:  monitoringService.getStats,
    refetchInterval: 30000,
  });

  const { data: health } = useQuery({
    queryKey: ['monitoring-health'],
    queryFn:  monitoringService.getHealth,
    refetchInterval: 15000,
  });

  const loading = statsLoading || sysLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm">System overview and management</p>
      </div>

      {/* System status banner */}
      {health && (
        <div className={`rounded-lg px-4 py-3 flex items-center justify-between text-sm ${
          health.status === 'healthy'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {health.status === 'healthy'
              ? <CheckCircle className="h-4 w-4" />
              : <AlertTriangle className="h-4 w-4" />}
            <span className="font-medium">
              System {health.status === 'healthy' ? 'Healthy' : 'Degraded'}
            </span>
            <span className="text-xs opacity-70">· Uptime {health.uptimeHuman}</span>
            <span className="text-xs opacity-70">· DB {health.database?.status}</span>
            <span className="text-xs opacity-70">· Heap {health.memory?.heapUsedMB}MB / {health.memory?.heapTotalMB}MB</span>
          </div>
          <Link to="/app/monitoring" className="text-xs underline opacity-70 hover:opacity-100">
            View details →
          </Link>
        </div>
      )}

      {/* Ticket stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Ticket}      label="Total Tickets"    value={loading ? '…' : stats?.total    ?? 0} color="blue"   />
        <StatCard icon={TrendingUp}  label="Open"             value={loading ? '…' : stats?.open     ?? 0} color="yellow" />
        <StatCard icon={CheckCircle} label="Resolved"         value={loading ? '…' : stats?.resolved ?? 0} color="green"  />
        <StatCard icon={AlertTriangle} label="Urgent"         value={loading ? '…' : stats?.urgent   ?? 0} color="red"    />
      </div>

      {/* System / user stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users}         label="Total Users"        value={loading ? '…' : sysStats?.users?.total       ?? 0} color="indigo" />
        <StatCard icon={Users}         label="New Today"          value={loading ? '…' : sysStats?.users?.newToday    ?? 0} color="indigo" />
        <StatCard icon={AlertTriangle} label="Unresolved Errors"  value={loading ? '…' : sysStats?.errors?.unresolved ?? 0} color={sysStats?.errors?.unresolved > 0 ? 'red' : 'green'} />
        <StatCard icon={Activity}      label="Audit Events Today" value={loading ? '…' : sysStats?.activity?.auditEventsToday ?? 0} color="gray" />
      </div>

      {/* Quick actions */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link to="/app/users"      className="btn btn-secondary flex items-center justify-center text-sm">
            <Users    className="h-4 w-4 mr-2" /> Manage Users
          </Link>
          <Link to="/app/tickets"    className="btn btn-secondary flex items-center justify-center text-sm">
            <Ticket   className="h-4 w-4 mr-2" /> All Tickets
          </Link>
          <Link to="/app/monitoring" className="btn btn-secondary flex items-center justify-center text-sm">
            <Activity className="h-4 w-4 mr-2" /> Monitoring
          </Link>
          <Link to="/app/settings"   className="btn btn-secondary flex items-center justify-center text-sm">
            <Settings className="h-4 w-4 mr-2" /> Settings
          </Link>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green:  'bg-green-50 text-green-600',
    red:    'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    gray:   'bg-gray-50 text-gray-600',
  };
  return (
    <div className="card p-5 flex items-center space-x-4">
      <div className={`p-2.5 rounded-lg ${colors[color] || colors.gray}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
