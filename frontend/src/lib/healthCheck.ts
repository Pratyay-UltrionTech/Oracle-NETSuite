import { getBackendRootUrl } from '../config/urls';

export type ServiceHealth = 'operational' | 'unavailable' | 'unknown';

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  services?: {
    api?: string;
    mongodb?: string;
  };
  timestamp?: string;
}

export async function fetchSystemHealth(): Promise<{
  ok: boolean;
  data: HealthResponse | null;
  latencyMs: number;
  error?: string;
}> {
  const started = performance.now();
  try {
    const res = await fetch(`${getBackendRootUrl()}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const latencyMs = Math.round(performance.now() - started);
    if (!res.ok) {
      return { ok: false, data: null, latencyMs, error: `HTTP ${res.status}` };
    }
    const data = (await res.json()) as HealthResponse;
    return { ok: true, data, latencyMs };
  } catch (err) {
    return {
      ok: false,
      data: null,
      latencyMs: Math.round(performance.now() - started),
      error: err instanceof Error ? err.message : 'Unable to reach server',
    };
  }
}
