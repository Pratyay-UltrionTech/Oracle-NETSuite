import { getBackendRootUrl } from '../config/urls';

/** Resolve API-relative asset paths (e.g. /api/uploads/...) to full backend URLs. */
export function resolveAssetUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const root = getBackendRootUrl();
  return `${root}${path.startsWith('/') ? path : `/${path}`}`;
}
