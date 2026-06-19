import * as React from 'react';

export function useLiveDate(intervalMs = 1000) {
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  const shortLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const monthYearLabel = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const fullDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const time = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return { now, shortLabel, monthYearLabel, fullDate, time, timezone };
}

export function formatRelativeTime(from: string | Date, now: Date): string {
  const date = typeof from === 'string' ? new Date(from) : from;
  const diffMs = now.getTime() - date.getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return 'Just now';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'Just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
