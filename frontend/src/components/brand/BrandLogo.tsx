import * as React from 'react';
import { cn } from '../../lib/utils';

const LOGO_SRC = '/brand/atisunya-logo.png';
const ICON_SRC = '/brand/atisunya-icon.png';

interface BrandLogoProps {
  variant?: 'auth' | 'sidebar' | 'sidebar-collapsed' | 'header';
  className?: string;
}

function BrandText({ inverted = false, compact = false }: { inverted?: boolean; compact?: boolean }) {
  return (
    <div className={cn('min-w-0', compact ? 'leading-tight' : 'leading-none')}>
      <p
        className={cn(
          'font-serif font-bold tracking-tight',
          compact ? 'text-[15px]' : 'text-[22px]',
          inverted ? 'text-white' : 'text-[#111]',
        )}
      >
        Atisunya
      </p>
      <div className={cn('bg-[#c0392b]', compact ? 'my-0.5 h-[2px] w-full' : 'my-1 h-[2.5px] w-full')} />
      <p
        className={cn(
          'font-serif font-semibold uppercase tracking-[0.12em]',
          compact ? 'text-[9px]' : 'text-[11px]',
          inverted ? 'text-white/90' : 'text-[#111]',
        )}
      >
        WebForm Builder
      </p>
    </div>
  );
}

function BrandIcon({ size, alt = 'Atisunya' }: { size: number; alt?: string }) {
  return (
    <div
      className="shrink-0 rounded-full overflow-hidden bg-white ring-1 ring-white/20"
      style={{ width: size, height: size }}
    >
      <img
        src={ICON_SRC}
        alt={alt}
        className="h-full w-full object-cover object-center"
        draggable={false}
      />
    </div>
  );
}

export function BrandLogo({ variant = 'auth', className }: BrandLogoProps) {
  if (variant === 'auth') {
    return (
      <div className={cn('mb-8', className)}>
        <img
          src={LOGO_SRC}
          alt="Atisunya"
          className="max-h-20 w-auto max-w-[280px] object-contain"
        />
      </div>
    );
  }

  if (variant === 'sidebar-collapsed') {
    return (
      <div className={cn('flex items-center justify-center', className)} title="Atisunya Infotech">
        <img
          src={LOGO_SRC}
          alt="Atisunya"
          className="h-9 w-9 object-cover object-left"
          draggable={false}
        />
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={cn('flex items-center min-w-0', className)}>
        <img
          src={LOGO_SRC}
          alt="Atisunya Infotech"
          className="h-10 w-auto max-w-[10.5rem] object-contain object-left"
          draggable={false}
        />
      </div>
    );
  }

  if (variant === 'header') {
    return (
      <div className={cn('flex items-center gap-2.5 min-w-0', className)}>
        <BrandIcon size={28} />
        <BrandText inverted compact />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center mb-8', className)}>
      <BrandIcon size={56} />
    </div>
  );
}

export const BRAND_NAME = 'Atisunya WebForm Builder';
