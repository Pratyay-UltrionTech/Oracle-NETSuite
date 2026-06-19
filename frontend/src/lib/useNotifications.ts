import * as React from 'react';
import { useStore } from '../store/useStore';
import { Submission } from '../types';

export type NotificationSeverity = 'info' | 'warning' | 'critical' | 'success';

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  createdAt: string;
  href?: string;
};

const READ_STORAGE_KEY = 'app-notifications-read';
const POLL_INTERVAL_MS = 30_000;

function loadReadIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function persistReadIds(ids: Set<string>) {
  localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...ids]));
}

function buildAdminNotifications(submissions: Submission[]): NotificationItem[] {
  const items: NotificationItem[] = [];
  const pending = submissions.filter(s => s.status === 'pending');
  const syncFailed = submissions.filter(s => s.status === 'NETSUITE_SYNC_FAILED');
  const critical = pending.filter(s => s.currentLevel && s.currentLevel > 2);

  if (critical.length > 0) {
    items.push({
      id: 'alert-critical-pending',
      title: `${critical.length} critical approval${critical.length > 1 ? 's' : ''}`,
      message: 'Overdue submissions need immediate attention',
      severity: 'critical',
      createdAt: critical[0]?.submittedAt || new Date().toISOString(),
      href: '/submissions',
    });
  }

  if (syncFailed.length > 0) {
    items.push({
      id: 'alert-sync-failed',
      title: `${syncFailed.length} NetSuite sync failure${syncFailed.length > 1 ? 's' : ''}`,
      message: 'Review failed submissions and retry sync',
      severity: 'warning',
      createdAt: syncFailed[0]?.submittedAt || new Date().toISOString(),
      href: '/submissions',
    });
  }

  if (pending.length > 0) {
    items.push({
      id: 'alert-pending-queue',
      title: `${pending.length} pending approval${pending.length > 1 ? 's' : ''}`,
      message: 'Submissions awaiting approver action',
      severity: 'warning',
      createdAt: pending[0]?.submittedAt || new Date().toISOString(),
      href: '/submissions',
    });
  }

  pending.slice(0, 4).forEach(submission => {
    items.push({
      id: `submission-pending-${submission.id}`,
      title: `Approval needed: ${submission.formName || 'Form'}`,
      message: `Submitted by ${submission.userName || 'Unknown user'}`,
      severity: 'info',
      createdAt: submission.submittedAt || new Date().toISOString(),
      href: '/submissions',
    });
  });

  return items;
}

function buildApprovalNotifications(approvals: Submission[]): NotificationItem[] {
  return approvals.map(submission => ({
    id: `approval-${submission.id}`,
    title: 'Awaiting your approval',
    message: `${submission.formName || 'Form'} from ${submission.userName || 'a user'}`,
    severity: 'warning' as const,
    createdAt: submission.submittedAt || new Date().toISOString(),
    href: '/submissions',
  }));
}

function buildUserNotifications(submissions: Submission[]): NotificationItem[] {
  return submissions
    .filter(s =>
      ['pending', 'rejected', 'NETSUITE_SYNC_FAILED', 'approved', 'SYNCED_TO_NETSUITE', 'submitted'].includes(
        s.status,
      ),
    )
    .slice(0, 8)
    .map(submission => {
      let severity: NotificationSeverity = 'info';
      let title = 'Submission update';

      switch (submission.status) {
        case 'pending':
        case 'submitted':
          title = 'Submission under review';
          severity = 'info';
          break;
        case 'rejected':
          title = 'Submission rejected';
          severity = 'critical';
          break;
        case 'NETSUITE_SYNC_FAILED':
          title = 'NetSuite sync failed';
          severity = 'critical';
          break;
        case 'approved':
        case 'SYNCED_TO_NETSUITE':
          title = 'Submission approved';
          severity = 'success';
          break;
      }

      return {
        id: `my-submission-${submission.id}-${submission.status}`,
        title,
        message: submission.formName || 'Your form submission',
        severity,
        createdAt: submission.submittedAt || submission.netsuiteAt || new Date().toISOString(),
        href: '/customer-dashboard',
      };
    });
}

export function useNotifications() {
  const user = useStore(state => state.user);
  const submissions = useStore(state => state.submissions);
  const fetchSubmissions = useStore(state => state.fetchSubmissions);
  const fetchMySubmissions = useStore(state => state.fetchMySubmissions);
  const fetchPendingApprovals = useStore(state => state.fetchPendingApprovals);

  const [approvalItems, setApprovalItems] = React.useState<Submission[]>([]);
  const [readIds, setReadIds] = React.useState<Set<string>>(loadReadIds);
  const [lastRefreshedAt, setLastRefreshedAt] = React.useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const refresh = React.useCallback(async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      if (user.role === 'super_admin' || user.role === 'client_admin') {
        await fetchSubmissions();
      } else {
        await fetchMySubmissions();
      }
      const approvals = await fetchPendingApprovals();
      setApprovalItems(approvals || []);
      setLastRefreshedAt(new Date());
    } finally {
      setIsRefreshing(false);
    }
  }, [user, fetchSubmissions, fetchMySubmissions, fetchPendingApprovals]);

  React.useEffect(() => {
    if (!user) return;
    void refresh();
    const intervalId = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [user, refresh]);

  const notifications = React.useMemo(() => {
    if (!user) return [];

    const roleNotifications =
      user.role === 'super_admin' || user.role === 'client_admin'
        ? buildAdminNotifications(submissions)
        : buildUserNotifications(submissions);

    const approvalNotifications = buildApprovalNotifications(approvalItems);
    const seen = new Set<string>();

    return [...approvalNotifications, ...roleNotifications]
      .filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [user, submissions, approvalItems]);

  const unreadCount = notifications.filter(item => !readIds.has(item.id)).length;

  const markAsRead = React.useCallback((id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      persistReadIds(next);
      return next;
    });
  }, []);

  const markAllRead = React.useCallback(() => {
    setReadIds(prev => {
      const next = new Set(prev);
      notifications.forEach(item => next.add(item.id));
      persistReadIds(next);
      return next;
    });
  }, [notifications]);

  const isRead = React.useCallback((id: string) => readIds.has(id), [readIds]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllRead,
    isRead,
    refresh,
    lastRefreshedAt,
    isRefreshing,
  };
}
