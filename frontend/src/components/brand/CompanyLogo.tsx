import * as React from 'react';
import { cn } from '../../lib/utils';
import { resolveAssetUrl } from '../../lib/resolveAssetUrl';

interface CompanyLogoProps {
  companyName: string;
  logoUrl?: string | null;
  variant?: 'sidebar' | 'sidebar-collapsed' | 'table';
  className?: string;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export function CompanyLogo({
  companyName,
  logoUrl,
  variant = 'sidebar',
  className,
}: CompanyLogoProps) {
  const src = resolveAssetUrl(logoUrl);
  const initials = initialsFromName(companyName || 'CO');

  if (variant === 'sidebar-collapsed') {
    return (
      <div
        className={cn(
          'flex items-center justify-center shrink-0 rounded-ns-md overflow-hidden bg-white/15 border border-white/25',
          className,
        )}
        style={{ width: 32, height: 32 }}
        title={companyName}
      >
        {src ? (
          <img src={src} alt={companyName} className="h-full w-full object-contain p-0.5" draggable={false} />
        ) : (
          <span className="text-[10px] font-bold text-white">{initials}</span>
        )}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div
        className={cn(
          'w-10 h-10 rounded-ns-md bg-ns-gray-bg border border-ns-border flex items-center justify-center overflow-hidden shrink-0',
          className,
        )}
      >
        {src ? (
          <img src={src} alt={companyName} className="h-full w-full object-contain p-1" draggable={false} />
        ) : (
          <span className="text-ns-navy/40 font-bold text-xs uppercase">{initials}</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2.5 min-w-0', className)}>
      <div className="w-9 h-9 shrink-0 rounded-ns-md overflow-hidden bg-white/15 border border-white/25 flex items-center justify-center">
        {src ? (
          <img src={src} alt={companyName} className="h-full w-full object-contain p-0.5" draggable={false} />
        ) : (
          <span className="text-[10px] font-bold text-white">{initials}</span>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm text-white truncate">{companyName}</p>
        <p className="text-[10px] text-white/70 truncate">Company portal</p>
      </div>
    </div>
  );
}
