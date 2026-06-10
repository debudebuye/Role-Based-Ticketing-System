import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket, Users, Clock, TrendingUp, Award, AlertCircle,
  CheckCircle2, BarChart3, RefreshCw, ChevronUp, ChevronDown
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ticketService } from '../../tickets/ticket.service.js';
import { monitoringService } from '../../monitoring/monitoring.service.js';

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color = 'primary' }) => {
  const palettes = {
    primary: 'bg-blue-50 text-blue-600',
    warning: 'bg-yellow-50 text-yellow-600',
    success: 'bg-green-50 text-green-600',
    danger:  'bg-red-50 text-red-600',
    purple:  'bg-purple-50 text-purple-600',
  };
  return (
    <div className="card p-5 flex items-center space-x-4">
      <div className={`p-3 rounded-lg flex-shrink-0 ${palettes[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

// ── Period picker ─────────────────────────────────────────────────────────────
const PeriodPicker = ({ value, onChange }) => (
  <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
    {['7d', '30d', '90d'].map(p => (
      <button
        key={p}
        onClick={() => onChange(p)}
        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
          value === p
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        {p === '7d' ? '7 days' : p === '30d' ? '30 days' : '90 days'}
      </button>
    ))}
  </div>
);

// ── Resolution rate badge ─────────────────────────────────────────────────────
const RateBadge = ({ rate }) => {
  const color =
    rate >= 80 ? 'bg-green-100 text-green-700' :
    rate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                 'bg-red-100 text-red-700';
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {rate?.toFixed(1) ?? '0.0'}%
    </span>
  );
};

// ── Agent performance table ───────────────────────────────────────────────────
const AgentPerformanceTable = () => {
  const [period, setPeriod]     = useState('30d');
  const [sortField, setSortField] = useState('resolved');
  const [sortDir, setSortDir]   = useState('desc');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['agent-performance', period],
    queryFn:  () => monitoringService.getAgentPerformance(period),
    refetchInterval: 60_000,
  });

  const agents  = data?.agents  ?? [];
  const summary = data?.summary ?? {};

  // Client-side sort
  const sorted = [...agents].sort((a, b) => {
    const av = a[sortField] ?? 0;
    const bv = b[sortField] ?? 0;
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp className="h-3 w-3 text-gray-300" />;
    return sortDir === 'asc'
      ? <ChevronUp className="h-3 w-3 text-blue-500" />
      : <ChevronDown className="h-3 w-3 text-blue-500" />;
  };

  const Th = ({ field, children }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer hover:bg-gray-100 select-none"
      onClick={() => toggleSort(field)}
    >
      <span className="flex items-center space-x-1">
        <span>{children}</span>
        <SortIcon field={field} />
      </span>
    </th>
  );

  return (
    <div className="card">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-4 w-4 mr-2 text-blue-500" />
            Agent Performance
          </h2>
          {summary.agentCount > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {summary.agentCount} agents · team resolution rate{' '}
              <span className="font-semibold text-gray-600">{summary.teamResolutionRate}%</span>
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <PeriodPicker value={period} onChange={setPeriod} />
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary row */}
      {summary.agentCount > 0 && (
        <div className="grid grid-cols-4 divide-x divide-gray-100 bg-gray-50 border-b border-gray-100">
          {[
            { label: 'Total Assigned', value: summary.totalAssigned },
            { label: 'Resolved',       value: summary.totalResolved },
            { label: 'In Progress',    value: summary.totalInProgress },
            { label: 'Still Open',     value: summary.totalOpen },
          ].map(({ label, value }) => (
            <div key={label} className="px-4 py-3 text-center">
              <p className="text-lg font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="p-8 text-center">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-400 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Loading performance data…</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="p-10 text-center">
          <Users className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No agent activity in this period.</p>
          <p className="text-gray-400 text-xs mt-1">Try a longer period or assign some tickets first.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <Th field="name">Agent</Th>
                <Th field="totalAssigned">Assigned</Th>
                <Th field="resolved">Resolved</Th>
                <Th field="inProgress">In Progress</Th>
                <Th field="rejected">Rejected</Th>
                <Th field="resolutionRate">Rate</Th>
                <Th field="avgResolutionHours">Avg Resolution</Th>
                <Th field="avgResponseHours">Avg Response</Th>
                <Th field="highPriorityHandled">High Priority</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((agent) => (
                <tr key={agent.agentId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                        {agent.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{agent.name}</p>
                        {agent.department && (
                          <p className="text-xs text-gray-400 truncate">{agent.department}</p>
                        )}
                      </div>
                      {!agent.isActive && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                          inactive
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-center">{agent.totalAssigned}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium text-green-700">{agent.resolved}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-center">{agent.inProgress}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    {agent.rejected > 0
                      ? <span className="text-red-500 font-medium">{agent.rejected}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <RateBadge rate={agent.resolutionRate} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-center">
                    {agent.avgResolutionHours != null
                      ? `${agent.avgResolutionHours}h`
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-center">
                    {agent.avgResponseHours != null
                      ? `${agent.avgResponseHours}h`
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {agent.highPriorityHandled > 0
                      ? <span className="text-orange-600 font-medium">{agent.highPriorityHandled}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Main dashboard ────────────────────────────────────────────────────────────
const ManagerDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['manager-ticket-stats'],
    queryFn:  ticketService.getTicketStats,
    refetchInterval: 30_000,
  });

  const { data: ticketsData } = useQuery({
    queryKey: ['unassigned-tickets'],
    queryFn:  () => ticketService.getAllTickets({ status: 'open', page: 1, limit: 100 }),
    refetchInterval: 30_000,
  });

  const unassignedCount = ticketsData?.tickets?.filter(t => !t.assignedTo).length ?? 0;
  const urgentCount     = stats?.urgent ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Team performance and ticket management</p>
      </div>

      {/* ── KPI row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Ticket}
          label="Total Tickets"
          value={statsLoading ? '…' : stats?.total ?? 0}
          color="primary"
        />
        <StatCard
          icon={Clock}
          label="Unassigned"
          value={unassignedCount}
          sub="need assignment"
          color={unassignedCount > 5 ? 'warning' : 'success'}
        />
        <StatCard
          icon={AlertCircle}
          label="Urgent / High"
          value={statsLoading ? '…' : urgentCount + (stats?.high ?? 0)}
          sub="open priority tickets"
          color={urgentCount > 0 ? 'danger' : 'warning'}
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Resolution"
          value={statsLoading ? '…' : `${stats?.avgResolutionTime?.toFixed(1) ?? '0.0'}h`}
          color="purple"
        />
      </div>

      {/* ── Secondary stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium">Open</p>
            <p className="text-xl font-bold text-gray-900">{statsLoading ? '…' : stats?.open ?? 0}</p>
          </div>
          <div className="w-2 h-10 rounded-full bg-blue-400" />
        </div>
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium">In Progress</p>
            <p className="text-xl font-bold text-gray-900">{statsLoading ? '…' : stats?.inProgress ?? 0}</p>
          </div>
          <div className="w-2 h-10 rounded-full bg-yellow-400" />
        </div>
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium">Resolved</p>
            <p className="text-xl font-bold text-gray-900">{statsLoading ? '…' : stats?.resolved ?? 0}</p>
          </div>
          <div className="w-2 h-10 rounded-full bg-green-400" />
        </div>
      </div>

      {/* ── Agent performance table ──────────────────────────────────────────── */}
      <AgentPerformanceTable />

      {/* ── Quick actions ────────────────────────────────────────────────────── */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            to="/app/tickets"
            className="btn btn-primary flex items-center justify-center"
          >
            <Ticket className="h-4 w-4 mr-2" />
            All Tickets
          </Link>
          <Link
            to="/app/users"
            className="btn btn-secondary flex items-center justify-center"
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Users
          </Link>
          <Link
            to="/app/tickets?status=open&unassigned=true"
            className="btn btn-secondary flex items-center justify-center"
          >
            <Award className="h-4 w-4 mr-2" />
            Assign Tickets
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
