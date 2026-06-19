import * as React from 'react';
import { cn } from '../../lib/utils';
import { UserRole } from '../../types';

export type StatusVariant = 'approved' | 'pending' | 'rejected' | 'draft' | 'synced' | 'inactive' | 'info';

const statusStyles: Record<StatusVariant, string> = {
  approved: 'bg-status-approved-bg text-status-approved border-status-approved/20',
  pending: 'bg-status-pending-bg text-status-pending border-status-pending/20',
  rejected: 'bg-status-rejected-bg text-status-rejected border-status-rejected/20',
  draft: 'bg-status-draft-bg text-status-draft border-status-draft/20',
  synced: 'bg-status-synced-bg text-status-synced border-status-synced/20',
  inactive: 'bg-status-draft-bg text-status-draft border-ns-border',
  info: 'bg-status-synced-bg text-status-synced border-status-synced/20',
};

export function StatusBadge({
  variant,
  children,
  className,
  dot,
}: {
  variant: StatusVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap',
        statusStyles[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'approved' && 'bg-status-approved',
            variant === 'pending' && 'bg-status-pending',
            variant === 'rejected' && 'bg-status-rejected',
            variant === 'draft' && 'bg-status-draft',
            variant === 'synced' && 'bg-status-synced',
            variant === 'inactive' && 'bg-status-draft',
            variant === 'info' && 'bg-status-synced',
          )}
        />
      )}
      {children}
    </span>
  );
}

const roleStyles: Record<UserRole, string> = {
  super_admin: 'bg-role-admin-bg text-role-admin',
  client_admin: 'bg-role-creator-bg text-role-creator',
  manager: 'bg-role-approver-bg text-role-approver',
  user: 'bg-role-vendor-bg text-role-vendor',
};

const roleLabels: Record<UserRole, string> = {
  super_admin: 'Admin',
  client_admin: 'Client Admin',
  manager: 'Approver',
  user: 'User',
};

export function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold',
        roleStyles[role],
        className,
      )}
    >
      {roleLabels[role]}
    </span>
  );
}

export function CountBadge({
  children,
  variant = 'pending',
  className,
}: {
  children: React.ReactNode;
  variant?: 'pending' | 'info' | 'neutral';
  className?: string;
}) {
  const variants = {
    pending: 'bg-status-pending-bg text-status-pending border-status-pending/25',
    info: 'bg-status-synced-bg text-status-synced border-status-synced/25',
    neutral: 'bg-ns-blue-soft text-ns-text-muted border-ns-border',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function submissionStatusVariant(status: string): StatusVariant {
  if (status === 'approved' || status === 'SYNCED_TO_NETSUITE' || status === 'submitted') return 'approved';
  if (status === 'rejected' || status === 'NETSUITE_SYNC_FAILED') return 'rejected';
  if (status === 'pending') return 'pending';
  if (status === 'draft') return 'draft';
  return 'draft';
}

export function submissionStatusLabel(status: string): string {
  if (status === 'SYNCED_TO_NETSUITE') return 'Synced';
  if (status === 'submitted' || status === 'approved') return 'Approved';
  if (status === 'NETSUITE_SYNC_FAILED' || status === 'rejected') return 'Rejected';
  if (status === 'pending') return 'Pending';
  if (status === 'draft') return 'Draft';
  return status.replace(/_/g, ' ');
}
