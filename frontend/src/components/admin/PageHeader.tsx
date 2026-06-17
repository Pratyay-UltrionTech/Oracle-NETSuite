import * as React from 'react';
import { cn } from '../../lib/utils';

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-end justify-between gap-4', className)}>
      <div>
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ns-text-muted mb-1">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold text-ns-text tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-ns-text-muted mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

export function InfoBanner({
  children,
  variant = 'warning',
  className,
}: {
  children: React.ReactNode;
  variant?: 'warning' | 'info' | 'neutral';
  className?: string;
}) {
  const variants = {
    warning: 'bg-status-pending-bg border-status-pending/25 text-ns-text',
    info: 'bg-status-synced-bg border-status-synced/25 text-ns-text',
    neutral: 'bg-ns-blue-soft border-ns-border text-ns-text-muted',
  };
  return (
    <div
      className={cn(
        'px-4 py-3 rounded-ns-md border text-xs leading-relaxed',
        variants[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
