// Phase 1: deployed URLs — move to env-based config later.

export const DEPLOYED_FRONTEND_URL =
  'https://jolly-forest-0bba2d80f.7.azurestaticapps.net';

export const DEPLOYED_BACKEND_URL =
  'https://netsuite-dyhtbhd7fmgecvgd.centralindia-01.azurewebsites.net';

export const LOCAL_API_URL = 'http://localhost:8000/api';

export const PRODUCTION_API_URL = `${DEPLOYED_BACKEND_URL}/api`;
