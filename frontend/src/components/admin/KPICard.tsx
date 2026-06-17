import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from './Card';

export function KPICard({
  label,
  value,
  subtext,
  subtextVariant = 'neutral',
  icon: Icon,
  onClick,
  className,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  subtextVariant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
}) {
  const subtextColors = {
    success: 'text-status-approved',
    warning: 'text-status-pending',
    danger: 'text-status-rejected',
    info: 'text-status-synced',
    neutral: 'text-ns-text-muted',
  };

  return (
    <Card
      padding="md"
      className={cn(
        'group transition-all hover:border-ns-blue/30',
        onClick && 'cursor-pointer',
        className,
      )}
      {...(onClick ? { onClick, role: 'button', tabIndex: 0 } : {})}
    >
      <div className="space-y-3">
        <p className="text-xs font-medium text-ns-text-muted">{label}</p>
        <div className="flex items-end justify-between gap-3">
          <p className="text-3xl font-bold text-ns-text tracking-tight">{value}</p>
          {Icon && (
            <div className="p-2 rounded-ns-md bg-ns-blue-soft text-ns-blue opacity-60 group-hover:opacity-100 transition-opacity">
              <Icon size={18} />
            </div>
          )}
        </div>
        {subtext && (
          <p className={cn('text-xs font-medium', subtextColors[subtextVariant])}>{subtext}</p>
        )}
      </div>
    </Card>
  );
}
