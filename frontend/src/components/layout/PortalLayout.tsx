import * as React from 'react';
import { useStore } from '../../store/useStore';
import AdminLayout from './AdminLayout';
import CustomerLayout from './CustomerLayout';

/** Wraps employee portal pages — client admins keep the admin shell; users get the supplier portal. */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = useStore(state => state.user);

  if (user?.role === 'client_admin') {
    return <AdminLayout>{children}</AdminLayout>;
  }

  return <CustomerLayout>{children}</CustomerLayout>;
}
