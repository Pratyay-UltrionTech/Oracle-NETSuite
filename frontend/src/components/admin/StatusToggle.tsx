import * as React from 'react';
import { cn } from '../../lib/utils';

type StatusToggleProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
};

export function StatusToggle({ checked, onChange, disabled, label }: StatusToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label ?? (checked ? 'Deactivate user' : 'Activate user')}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      title={label ?? (checked ? 'Click to deactivate' : 'Click to activate')}
      className={cn(
        'relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-ns-blue/30',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        checked ? 'bg-status-approved' : 'bg-ns-border',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200',
          checked ? 'translate-x-4' : 'translate-x-0',
        )}
      />
    </button>
  );
}
