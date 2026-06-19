import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, RefreshCw, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatRelativeTime, useLiveDate } from '../../lib/useLiveDate';
import { NotificationItem, NotificationSeverity, useNotifications } from '../../lib/useNotifications';

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

const severityStyles: Record<NotificationSeverity, { dot: string; icon: React.ElementType; iconClass: string }> = {
  critical: { dot: 'bg-status-rejected', icon: AlertTriangle, iconClass: 'text-status-rejected bg-status-rejected-bg' },
  warning: { dot: 'bg-status-pending', icon: AlertTriangle, iconClass: 'text-status-pending bg-status-pending-bg' },
  info: { dot: 'bg-status-synced', icon: Info, iconClass: 'text-status-synced bg-status-synced-bg' },
  success: { dot: 'bg-status-approved', icon: CheckCircle2, iconClass: 'text-status-approved bg-status-approved-bg' },
};

function NotificationRow({
  item,
  isUnread,
  now,
  onSelect,
}: {
  item: NotificationItem;
  isUnread: boolean;
  now: Date;
  onSelect: () => void;
}) {
  const styles = severityStyles[item.severity];
  const Icon = styles.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left px-4 py-3 flex gap-3 hover:bg-ns-page-bg transition-colors border-b border-ns-border/60 last:border-b-0',
        isUnread && 'bg-ns-blue-soft/40',
      )}
    >
      <div className={cn('w-8 h-8 rounded-ns-md flex items-center justify-center flex-shrink-0', styles.iconClass)}>
        <Icon size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-xs font-semibold text-ns-text', isUnread && 'text-ns-navy')}>{item.title}</p>
          {isUnread && <span className={cn('w-2 h-2 rounded-full flex-shrink-0 mt-1', styles.dot)} />}
        </div>
        <p className="text-[11px] text-ns-text-muted mt-0.5 leading-relaxed">{item.message}</p>
        <p className="text-[10px] text-ns-text-muted/80 mt-1 tabular-nums">
          {formatRelativeTime(item.createdAt, now)}
        </p>
      </div>
    </button>
  );
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { now } = useLiveDate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllRead,
    isRead,
    refresh,
    lastRefreshedAt,
    isRefreshing,
  } = useNotifications();

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  const handleSelect = (item: NotificationItem) => {
    markAsRead(item.id);
    setIsOpen(false);
    if (item.href) navigate(item.href);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={cn(
          'relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-ns-md transition-colors',
          isOpen && 'bg-white/10 text-white',
        )}
        aria-expanded={isOpen}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-status-pending text-white text-[9px] font-bold rounded-full flex items-center justify-center tabular-nums">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : notifications.length > 0 ? (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-pending rounded-full border-2 border-ns-blue" />
        ) : null}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-ns-md shadow-xl border border-ns-border z-50 animate-in fade-in slide-in-from-top-1 duration-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-ns-border flex items-center justify-between bg-ns-page-bg">
            <div>
              <p className="text-sm font-semibold text-ns-text">Notifications</p>
              {lastRefreshedAt && (
                <p className="text-[10px] text-ns-text-muted mt-0.5">
                  Updated {formatRelativeTime(lastRefreshedAt, now)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void refresh()}
                disabled={isRefreshing}
                className="p-1.5 rounded-ns-sm text-ns-text-muted hover:text-ns-text hover:bg-white transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw size={14} className={cn(isRefreshing && 'animate-spin')} />
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="p-1.5 rounded-ns-sm text-ns-text-muted hover:text-ns-text hover:bg-white transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell size={24} className="mx-auto text-ns-text-muted/40 mb-2" />
                <p className="text-xs font-medium text-ns-text-muted">No notifications right now</p>
                <p className="text-[10px] text-ns-text-muted/70 mt-1">We&apos;ll alert you when something needs attention</p>
              </div>
            ) : (
              notifications.map(item => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  isUnread={!isRead(item.id)}
                  now={now}
                  onSelect={() => handleSelect(item)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
