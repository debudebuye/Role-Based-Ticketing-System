import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, RotateCcw, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { monitoringService } from '../../monitoring/monitoring.service.js';

// Default values — used as fallback if the API hasn't been seeded yet
const DEFAULTS = {
  allowRegistration:           true,
  logLevel:                    'info',
  maxLoginAttempts:            5,
  sessionTimeoutMin:           30,
  passwordMinLength:           8,
  passwordRequireSpecialChars: true,
};

const Toggle = ({ checked, onChange, label, description }) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

const SystemSettings = ({ user: _user }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(DEFAULTS);
  const [dirty, setDirty] = useState(false);

  // ── Fetch current config ────────────────────────────────────────────────────
  const { data: config, isLoading, isError } = useQuery({
    queryKey: ['system-config'],
    queryFn:  monitoringService.getSystemConfig,
    staleTime: 60_000,
  });

  // Populate form once loaded
  useEffect(() => {
    if (config) {
      setForm({
        allowRegistration:           config.allowRegistration           ?? DEFAULTS.allowRegistration,
        logLevel:                    config.logLevel                    ?? DEFAULTS.logLevel,
        maxLoginAttempts:            config.maxLoginAttempts            ?? DEFAULTS.maxLoginAttempts,
        sessionTimeoutMin:           config.sessionTimeoutMin           ?? DEFAULTS.sessionTimeoutMin,
        passwordMinLength:           config.passwordMinLength           ?? DEFAULTS.passwordMinLength,
        passwordRequireSpecialChars: config.passwordRequireSpecialChars ?? DEFAULTS.passwordRequireSpecialChars,
      });
      setDirty(false);
    }
  }, [config]);

  // ── Save mutation ───────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: monitoringService.updateSystemConfig,
    onSuccess: (updated) => {
      queryClient.setQueryData(['system-config'], updated);
      toast.success('System settings saved');
      setDirty(false);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to save settings');
    },
  });

  const set = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleReset = () => {
    if (config) {
      setForm({
        allowRegistration:           config.allowRegistration           ?? DEFAULTS.allowRegistration,
        logLevel:                    config.logLevel                    ?? DEFAULTS.logLevel,
        maxLoginAttempts:            config.maxLoginAttempts            ?? DEFAULTS.maxLoginAttempts,
        sessionTimeoutMin:           config.sessionTimeoutMin           ?? DEFAULTS.sessionTimeoutMin,
        passwordMinLength:           config.passwordMinLength           ?? DEFAULTS.passwordMinLength,
        passwordRequireSpecialChars: config.passwordRequireSpecialChars ?? DEFAULTS.passwordRequireSpecialChars,
      });
    } else {
      setForm(DEFAULTS);
    }
    setDirty(false);
  };

  if (isLoading) {
    return (
      <div className="card p-12 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-500">Loading system settings…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card p-6 flex items-start space-x-3 bg-red-50 border border-red-200">
        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-800">Failed to load system settings</p>
          <p className="text-xs text-red-600 mt-1">Check your connection and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">System Settings</h2>
        <p className="text-sm text-gray-500 mt-1">
          Runtime configuration — changes take effect immediately without restart.
        </p>
        {config?.updatedBy && (
          <p className="text-xs text-gray-400 mt-1">
            Last updated by {config.updatedBy?.name ?? 'admin'} · {new Date(config.updatedAt).toLocaleString()}
          </p>
        )}
      </div>

      <div className="p-6 space-y-8">

        {/* ── Registration ───────────────────────────────────────────── */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Registration</h3>
          <div className="divide-y divide-gray-100">
            <Toggle
              checked={form.allowRegistration}
              onChange={v => set('allowRegistration', v)}
              label="Allow public registration"
              description="When off, new users can only be created by admins or managers."
            />
          </div>
        </section>

        {/* ── Logging ────────────────────────────────────────────────── */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Logging</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Log Level</label>
            <select
              value={form.logLevel}
              onChange={e => set('logLevel', e.target.value)}
              className="input max-w-xs"
            >
              <option value="error">Error — production critical only</option>
              <option value="warn">Warning — errors + warnings</option>
              <option value="info">Info — normal production level</option>
              <option value="debug">Debug — verbose (dev only)</option>
            </select>
            {form.logLevel === 'debug' && (
              <p className="text-xs text-amber-600 mt-1 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Debug logging can expose sensitive data in production logs.
              </p>
            )}
          </div>
        </section>

        {/* ── Security Policy ─────────────────────────────────────────── */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Security Policy</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max login attempts
              </label>
              <input
                type="number" min={1} max={20}
                value={form.maxLoginAttempts}
                onChange={e => set('maxLoginAttempts', parseInt(e.target.value) || 5)}
                className="input"
              />
              <p className="text-xs text-gray-400 mt-0.5">Account locks after this many failures.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session timeout (min)
              </label>
              <input
                type="number" min={5} max={480}
                value={form.sessionTimeoutMin}
                onChange={e => set('sessionTimeoutMin', parseInt(e.target.value) || 30)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min password length
              </label>
              <input
                type="number" min={6} max={32}
                value={form.passwordMinLength}
                onChange={e => set('passwordMinLength', parseInt(e.target.value) || 8)}
                className="input"
              />
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            <Toggle
              checked={form.passwordRequireSpecialChars}
              onChange={v => set('passwordRequireSpecialChars', v)}
              label="Require special characters in passwords"
              description="Passwords must contain at least one special character (!, @, #, etc.)"
            />
          </div>
        </section>

        {/* ── Actions ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleReset}
            disabled={!dirty || saveMutation.isPending}
            className="btn btn-secondary flex items-center disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Discard
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate(form)}
            disabled={!dirty || saveMutation.isPending}
            className="btn btn-primary flex items-center disabled:opacity-60"
          >
            {saveMutation.isPending
              ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              : <Save className="h-4 w-4 mr-1.5" />}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
