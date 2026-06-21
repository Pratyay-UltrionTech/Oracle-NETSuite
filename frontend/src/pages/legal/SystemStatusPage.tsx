import * as React from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { LegalPageLayout } from '../../components/layout/LegalPageLayout';
import { fetchSystemHealth } from '../../lib/healthCheck';
import { AUTH_ROUTES } from '../../config/authRoutes';

function StatusRow({ label, status }: { label: string; status: string }) {
  const operational = status === 'operational' || status === 'ok';
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#e8e8e8] last:border-0">
      <span className="font-medium text-[#222]">{label}</span>
      <span
        className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${
          operational ? 'text-[#16a34a]' : 'text-[#dc2626]'
        }`}
      >
        {operational ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
        {operational ? 'Operational' : 'Unavailable'}
      </span>
    </div>
  );
}

export default function SystemStatusPage() {
  const [loading, setLoading] = React.useState(true);
  const [latencyMs, setLatencyMs] = React.useState<number | null>(null);
  const [checkedAt, setCheckedAt] = React.useState<string | null>(null);
  const [apiStatus, setApiStatus] = React.useState('unknown');
  const [mongoStatus, setMongoStatus] = React.useState('unknown');
  const [overall, setOverall] = React.useState<'operational' | 'degraded' | 'down'>('down');
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchSystemHealth();
    setLatencyMs(result.latencyMs);
    setCheckedAt(new Date().toLocaleString());

    if (!result.ok || !result.data) {
      setOverall('down');
      setApiStatus('unavailable');
      setMongoStatus('unknown');
      setError(result.error || 'Health check failed');
      setLoading(false);
      return;
    }

    const api = result.data.services?.api || 'operational';
    const mongo = result.data.services?.mongodb || 'unknown';
    setApiStatus(api);
    setMongoStatus(mongo);

    if (result.data.status === 'ok' && mongo === 'operational') {
      setOverall('operational');
    } else if (result.data.status === 'degraded' || mongo !== 'operational') {
      setOverall('degraded');
    } else {
      setOverall('down');
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <LegalPageLayout title="System Status">
      <div className="flex items-center justify-between gap-4 mb-2">
        <p className="text-[#666] text-[12px]">
          Live status of Atisunya WebForm Builder services.
        </p>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-[12px] text-[#0077cc] hover:underline disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      <div
        className={`rounded-lg border p-4 mb-4 ${
          overall === 'operational'
            ? 'bg-[#f0fdf4] border-[#bbf7d0]'
            : overall === 'degraded'
              ? 'bg-[#fffbeb] border-[#fde68a]'
              : 'bg-[#fef2f2] border-[#fecaca]'
        }`}
      >
        <p className="text-[14px] font-bold text-[#222] mb-1">
          {overall === 'operational' && 'All systems operational'}
          {overall === 'degraded' && 'Partial system degradation'}
          {overall === 'down' && 'Service unavailable'}
        </p>
        {checkedAt && (
          <p className="text-[11px] text-[#666]">
            Last checked: {checkedAt}
            {latencyMs != null && ` · ${latencyMs}ms response`}
          </p>
        )}
        {error && <p className="text-[11px] text-[#dc2626] mt-2">{error}</p>}
      </div>

      <div className="rounded-lg border border-[#e8e8e8] bg-white px-4">
        <StatusRow label="Application API" status={apiStatus} />
        <StatusRow label="Database (MongoDB)" status={mongoStatus} />
        <StatusRow label="Authentication" status={apiStatus === 'operational' ? 'operational' : 'unavailable'} />
      </div>

      <p className="text-[12px] text-[#666] pt-2">
        If you experience issues signing in,{' '}
        <Link to={AUTH_ROUTES.login} className="text-[#0077cc] hover:underline">
          return to the login page
        </Link>{' '}
        and try again, or contact your administrator.
      </p>
    </LegalPageLayout>
  );
}
