import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity, Server, Users, AlertTriangle, CheckCircle,
  Clock, Database, Cpu, MemoryStick, RefreshCw,
  ShieldAlert, FileText, TrendingUp, Wifi, WifiOff,
  ChevronDown, ChevronUp, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { monitoringService } from './monitoring.service.js';
import { formatDate } from '../../shared/utils/helpers.js';

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',   label: 'Overview',    icon: Activity    },
  { id: 'health',     label: 'System Health', icon: Server    },
  { id: 'errors',     label: 'Error Feed',  icon: AlertTriangle },
  { id: 'audit',      label: 'Audit Log',   icon: FileText    },
  { id: 'users',      label: 'Active Users', icon: Users      },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const StatusDot = ({ ok }) => (
  <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
);

const StatCard = ({ icon: Icon, label, value, sub, color = 'primary' }) => {
  const colors = {
    primary: 'bg-blue-50 text-blue-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-yellow-50 text-yellow-600',
    danger:  'bg-red-50 text-red-600',
    gray:    'bg-gray-50 text-gray-600',
  };
  return (
    <div className="card p-5 flex items-center space-x-4">
      <div className={`p-3 rounded-lg ${colors[color]}`}>
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

// ── Overview tab ──────────────────────────────────────────────────────────────
const OverviewTab = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['monitoring-stats'],
    queryFn:  monitoringService.getStats,
    refetchInterval: 30000,
  });

  if (isLoading) return <LoadingGrid />;

  const { users, tickets, errors, activity, ticketTrend = [] } = data || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users}        label="Total Users"       value={users?.total}        sub={`${users?.newToday} new today`}       color="primary" />
        <StatCard icon={Activity}     label="Open Tickets"      value={tickets?.open}       sub={`${tickets?.resolvedToday} resolved today`} color="warning" />
        <StatCard icon={AlertTriangle} label="Unresolved Errors" value={errors?.unresolved}  sub={`${errors?.today} today`}             color={errors?.unresolved > 0 ? 'danger' : 'success'} />
        <StatCard icon={FileText}     label="Audit Events Today" value={activity?.auditEventsToday} color="gray" />
      </div>

      {/* Ticket trend mini-chart */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
          Ticket Volume — Last 7 Days
        </h3>
        {ticketTrend.length === 0 ? (
          <p className="text-sm text-gray-400">No ticket data for this period.</p>
        ) : (
          <div className="flex items-end space-x-2 h-24">
            {ticketTrend.map((d) => {
              const max = Math.max(...ticketTrend.map(x => x.count), 1);
              const pct = Math.round((d.count / max) * 100);
              return (
                <div key={d._id} className="flex flex-col items-center flex-1">
                  <span className="text-xs text-gray-500 mb-1">{d.count}</span>
                  <div
                    className="w-full bg-blue-400 rounded-t"
                    style={{ height: `${Math.max(pct, 4)}%` }}
                    title={`${d._id}: ${d.count} tickets`}
                  />
                  <span className="text-xs text-gray-400 mt-1 truncate w-full text-center">
                    {d._id.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Health tab ────────────────────────────────────────────────────────────────
const HealthTab = () => {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['monitoring-health'],
    queryFn:  monitoringService.getHealth,
    refetchInterval: 15000,
  });

  if (isLoading) return <LoadingGrid />;

  const h = data || {};
  const memPct = h.memory
    ? Math.round((h.memory.heapUsedMB / h.memory.heapTotalMB) * 100)
    : 0;
  const sysPct = h.system
    ? Math.round(((h.system.totalMemMB - h.system.freeMemMB) / h.system.totalMemMB) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className={`card p-4 flex items-center justify-between ${
        h.status === 'healthy' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center">
          {h.status === 'healthy'
            ? <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            : <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />}
          <span className={`font-semibold ${h.status === 'healthy' ? 'text-green-800' : 'text-red-800'}`}>
            System {h.status === 'healthy' ? 'Healthy' : 'Degraded'}
          </span>
          <span className="ml-3 text-sm text-gray-500">Uptime: {h.uptimeHuman}</span>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn btn-secondary text-sm flex items-center"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Database className="h-4 w-4 mr-2 text-blue-500" />
            Database
          </h3>
          <div className="space-y-2 text-sm">
            <Row label="Status">
              <StatusDot ok={h.database?.status === 'connected'} />
              <span className="capitalize">{h.database?.status}</span>
            </Row>
            <Row label="Host">{h.database?.host}</Row>
            <Row label="Database">{h.database?.name}</Row>
          </div>
        </div>

        {/* Process memory */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <MemoryStick className="h-4 w-4 mr-2 text-purple-500" />
            Process Memory
          </h3>
          <div className="space-y-2 text-sm">
            <Row label="Heap Used">{h.memory?.heapUsedMB} MB</Row>
            <Row label="Heap Total">{h.memory?.heapTotalMB} MB</Row>
            <Row label="RSS">{h.memory?.rssMB} MB</Row>
          </div>
          <ProgressBar pct={memPct} color="purple" label={`${memPct}% heap used`} />
        </div>

        {/* System */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Cpu className="h-4 w-4 mr-2 text-orange-500" />
            System
          </h3>
          <div className="space-y-2 text-sm">
            <Row label="Platform">{h.system?.platform} / {h.system?.arch}</Row>
            <Row label="CPUs">{h.system?.cpus}</Row>
            <Row label="Load Avg">{h.system?.loadAvg?.map(l => l.toFixed(2)).join(' / ')}</Row>
            <Row label="Free Memory">{h.system?.freeMemMB} MB / {h.system?.totalMemMB} MB</Row>
          </div>
          <ProgressBar pct={sysPct} color="orange" label={`${sysPct}% system memory used`} />
        </div>

        {/* Runtime */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Server className="h-4 w-4 mr-2 text-green-500" />
            Runtime
          </h3>
          <div className="space-y-2 text-sm">
            <Row label="Node.js">{h.nodeVersion}</Row>
            <Row label="Environment">{h.environment}</Row>
            <Row label="Uptime">{h.uptimeHuman}</Row>
            <Row label="Last checked">{h.timestamp ? new Date(h.timestamp).toLocaleTimeString() : '—'}</Row>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Error feed tab ────────────────────────────────────────────────────────────
const ErrorsTab = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('unresolved'); // unresolved | all
  const [page, setPage]     = useState(1);
  const [expanded, setExpanded] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['monitoring-errors', filter, page],
    queryFn:  () => monitoringService.getErrors({
      resolved: filter === 'all' ? undefined : 'false',
      page,
      limit: 20,
    }),
    refetchInterval: 15000,
  });

  const resolveMutation = useMutation({
    mutationFn: monitoringService.resolveError,
    onSuccess: () => {
      toast.success('Error marked as resolved');
      queryClient.invalidateQueries({ queryKey: ['monitoring-errors'] });
      queryClient.invalidateQueries({ queryKey: ['monitoring-stats'] });
    },
    onError: () => toast.error('Failed to resolve error'),
  });

  const errors     = data?.errors     || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {['unresolved', 'all'].map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'unresolved' ? 'Unresolved' : 'All Errors'}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-500">{pagination.total ?? 0} total</span>
      </div>

      {isLoading ? <LoadingList /> : errors.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No errors — system is clean</p>
        </div>
      ) : (
        <div className="space-y-2">
          {errors.map(err => (
            <div key={err._id} className={`card border-l-4 ${err.resolved ? 'border-l-green-400' : 'border-l-red-500'}`}>
              <div
                className="p-4 cursor-pointer flex items-start justify-between"
                onClick={() => setExpanded(expanded === err._id ? null : err._id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      err.resolved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {err.statusCode}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">{err.method} {err.url}</span>
                    {err.userEmail && (
                      <span className="text-xs text-gray-400">· {err.userEmail}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{err.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(err.createdAt)}</p>
                </div>
                <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                  {!err.resolved && (
                    <button
                      onClick={(e) => { e.stopPropagation(); resolveMutation.mutate(err._id); }}
                      disabled={resolveMutation.isPending}
                      className="text-xs px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100"
                    >
                      Resolve
                    </button>
                  )}
                  {expanded === err._id
                    ? <ChevronUp className="h-4 w-4 text-gray-400" />
                    : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </div>
              </div>

              {expanded === err._id && err.stack && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2 mt-3">Stack Trace</p>
                  <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                    {err.stack}
                  </pre>
                  {err.ip && (
                    <p className="text-xs text-gray-400 mt-2">IP: {err.ip}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <Pagination page={page} pages={pagination.pages} onChange={setPage} />
      )}
    </div>
  );
};

// ── Audit log tab ─────────────────────────────────────────────────────────────
const AuditTab = () => {
  const [page, setPage]     = useState(1);
  const [action, setAction] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['monitoring-audit', action, page],
    queryFn:  () => monitoringService.getAuditLog({ action: action || undefined, page, limit: 20 }),
    refetchInterval: 30000,
  });

  const logs       = data?.logs       || [];
  const pagination = data?.pagination || {};

  const ACTION_COLORS = {
    created:        'bg-blue-100 text-blue-700',
    updated:        'bg-yellow-100 text-yellow-700',
    deleted:        'bg-red-100 text-red-700',
    status_changed: 'bg-purple-100 text-purple-700',
    assigned:       'bg-indigo-100 text-indigo-700',
    accepted:       'bg-green-100 text-green-700',
    rejected:       'bg-orange-100 text-orange-700',
    priority_changed: 'bg-pink-100 text-pink-700',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <select
          value={action}
          onChange={e => { setAction(e.target.value); setPage(1); }}
          className="input max-w-xs text-sm"
        >
          <option value="">All Actions</option>
          {Object.keys(ACTION_COLORS).map(a => (
            <option key={a} value={a}>{a.replace('_', ' ')}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">{pagination.total ?? 0} events</span>
      </div>

      {isLoading ? <LoadingList /> : logs.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No audit events found</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {logs.map(log => (
            <div key={log._id} className="p-4 flex items-start space-x-3">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0 mt-0.5 ${
                ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'
              }`}>
                {log.action?.replace('_', ' ')}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {log.performedBy?.name || 'Unknown'}
                  </span>
                  <span className="text-xs text-gray-400">({log.performedBy?.role})</span>
                  {log.ticketId && (
                    <span className="text-xs text-gray-500 truncate">
                      · {log.ticketId?.title || log.ticketId}
                    </span>
                  )}
                </div>
                {log.changes && Object.keys(log.changes).length > 0 && (
                  <div className="mt-1 text-xs text-gray-500">
                    {Object.entries(log.changes).map(([field, { from, to }]) => (
                      <span key={field} className="mr-3">
                        <span className="font-medium">{field}:</span>{' '}
                        <span className="line-through text-red-400">{String(from)}</span>
                        {' → '}
                        <span className="text-green-600">{String(to)}</span>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(log.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <Pagination page={page} pages={pagination.pages} onChange={setPage} />
      )}
    </div>
  );
};

// ── Active users tab ──────────────────────────────────────────────────────────
const ActiveUsersTab = () => {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['monitoring-active-users'],
    queryFn:  monitoringService.getActiveUsers,
    refetchInterval: 10000,
  });

  const users = data?.users || [];

  const ROLE_COLORS = {
    admin:    'bg-red-100 text-red-700',
    manager:  'bg-purple-100 text-purple-700',
    agent:    'bg-blue-100 text-blue-700',
    customer: 'bg-green-100 text-green-700',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {data?.count > 0
            ? <Wifi className="h-5 w-5 text-green-500" />
            : <WifiOff className="h-5 w-5 text-gray-400" />}
          <span className="font-semibold text-gray-900">
            {data?.count ?? 0} user{data?.count !== 1 ? 's' : ''} online
          </span>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn btn-secondary text-sm flex items-center"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? <LoadingList /> : users.length === 0 ? (
        <div className="card p-12 text-center">
          <WifiOff className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No users currently connected</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {users.map(u => (
            <div key={u.userId} className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                  {u.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-400">Connected {formatDate(u.connectedAt)}</p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                {u.role}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Shared sub-components ─────────────────────────────────────────────────────
const Row = ({ label, children }) => (
  <div className="flex justify-between">
    <span className="text-gray-500">{label}</span>
    <span className="text-gray-900 font-medium text-right">{children}</span>
  </div>
);

const ProgressBar = ({ pct, color, label }) => {
  const colors = { purple: 'bg-purple-400', orange: 'bg-orange-400', blue: 'bg-blue-400' };
  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colors[color] || 'bg-blue-400'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
};

const Pagination = ({ page, pages, onChange }) => (
  <div className="flex items-center justify-center space-x-2 pt-2">
    <button
      onClick={() => onChange(page - 1)}
      disabled={page <= 1}
      className="btn btn-secondary text-sm px-3 py-1 disabled:opacity-40"
    >
      Previous
    </button>
    <span className="text-sm text-gray-500">Page {page} of {pages}</span>
    <button
      onClick={() => onChange(page + 1)}
      disabled={page >= pages}
      className="btn btn-secondary text-sm px-3 py-1 disabled:opacity-40"
    >
      Next
    </button>
  </div>
);

const LoadingGrid = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
    {[1,2,3,4].map(i => <div key={i} className="card h-24 bg-gray-100" />)}
  </div>
);

const LoadingList = () => (
  <div className="space-y-2 animate-pulse">
    {[1,2,3,4,5].map(i => <div key={i} className="card h-16 bg-gray-100" />)}
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
const MonitoringPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
        <p className="text-gray-500 text-sm mt-1">
          Real-time health, errors, audit trail, and active sessions
        </p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap transition-colors ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4 mr-1.5" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'health'   && <HealthTab />}
      {activeTab === 'errors'   && <ErrorsTab />}
      {activeTab === 'audit'    && <AuditTab />}
      {activeTab === 'users'    && <ActiveUsersTab />}
    </div>
  );
};

export default MonitoringPage;
