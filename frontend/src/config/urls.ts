// Phase 1: deployed URLs — move to env-based config later.

export const DEPLOYED_FRONTEND_URL = 'https://stage.atisunya.cloud';

export const DEPLOYED_BACKEND_URL =
  'https://netsuite-dyhtbhd7fmgecvgd.centralindia-01.azurewebsites.net';

export const LOCAL_API_URL = 'http://localhost:8000/api';

export const PRODUCTION_API_URL = `${DEPLOYED_BACKEND_URL}/api`;

/** Backend origin without /api — used for /health and other root endpoints. */
export function getBackendRootUrl(): string {
  const apiBase =
    (import.meta.env.VITE_API_URL as string | undefined) ||
    (import.meta.env.DEV ? LOCAL_API_URL : PRODUCTION_API_URL);
  return apiBase.replace(/\/api\/?$/, '');
}
