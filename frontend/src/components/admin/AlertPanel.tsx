import * as React from 'react';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

type AlertSeverity = 'critical' | 'warning' | 'info';

const severityStyles: Record<AlertSeverity, { container: string; icon: string }> = {
  critical: {
    container: 'bg-status-rejected-bg border-status-rejected/25',
    icon: 'text-status-rejected',
  },
  warning: {
    container: 'bg-status-pending-bg border-status-pending/25',
    icon: 'text-status-pending',
  },
  info: {
    container: 'bg-status-synced-bg border-status-synced/25',
    icon: 'text-status-synced',
  },
};

export function AlertPanel({
  severity,
  title,
  description,
  icon: Icon,
  className,
}: {
  severity: AlertSeverity;
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  const styles = severityStyles[severity];
  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-ns-md border',
        styles.container,
        className,
      )}
    >
      {Icon && <Icon size={16} className={cn('mt-0.5 flex-shrink-0', styles.icon)} />}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ns-text">{title}</p>
        {description && (
          <p className="text-xs text-ns-text-muted mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  );
}
