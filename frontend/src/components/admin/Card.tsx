import * as React from 'react';
import { cn } from '../../lib/utils';

export function Card({
  children,
  className,
  padding = 'md',
  onClick,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
} & React.HTMLAttributes<HTMLDivElement>) {
  const paddingMap = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-ns-card border border-ns-border ns-panel-shadow',
        paddingMap[padding],
        onClick && 'cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  badge,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-4', className)}>
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-ns-text">{title}</h3>
          {badge}
        </div>
        {subtitle && <p className="text-xs text-ns-text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
