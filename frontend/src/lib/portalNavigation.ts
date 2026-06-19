import { UserRole } from '../types';

/** Home route for the employee form-filling portal (assigned forms overview). */
export function getPortalHomePath(role?: UserRole): string {
  if (role === 'client_admin') return '/my-forms';
  return '/customer-dashboard';
}

export function usesAdminPortalShell(role?: UserRole): boolean {
  return role === 'client_admin';
}
