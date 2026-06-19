import * as React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLiveDate } from '../../lib/useLiveDate';

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void, enabled: boolean) {
  React.useEffect(() => {
    if (!enabled) return;

    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [ref, onClose, enabled]);
}

type LiveDateButtonProps = {
  variant?: 'compact' | 'full';
  className?: string;
};

export default function LiveDateButton({ variant = 'compact', className }: LiveDateButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { monthYearLabel, shortLabel, fullDate, time, timezone } = useLiveDate();

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  const label = variant === 'compact' ? monthYearLabel : shortLabel;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-white/90 border border-white/25 rounded-ns-md hover:bg-white/10 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Calendar size={14} />
        <span className="tabular-nums">{label}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-ns-md shadow-xl border border-ns-border z-50 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="px-4 py-3 border-b border-ns-border bg-ns-page-bg rounded-t-ns-md">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-ns-text-muted">Today</p>
            <p className="text-sm font-semibold text-ns-text mt-1">{fullDate}</p>
          </div>
          <div className="px-4 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-ns-md bg-ns-blue-soft flex items-center justify-center text-ns-blue">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-ns-text tabular-nums tracking-tight">{time}</p>
              <p className="text-[10px] text-ns-text-muted mt-0.5">{timezone}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
