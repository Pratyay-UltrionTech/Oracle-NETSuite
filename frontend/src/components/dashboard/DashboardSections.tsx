import {
  Activity,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AlertPanel,
  Card,
  CardHeader,
  StatusBadge,
  submissionStatusVariant,
} from '../admin';
import { Table, THead, TBody, TR, TH, TD } from '../ui/Complex';
import { Submission } from '../../types';

export function computeSubmissionMetrics(submissions: Submission[]) {
  const pendingApprovals = submissions.filter(s => s.status === 'pending').length;
  const criticalPending = submissions.filter(
    s => s.status === 'pending' && s.currentLevel && s.currentLevel > 2,
  ).length;
  const syncFailed = submissions.filter(s => s.status === 'NETSUITE_SYNC_FAILED').length;
  const completed = submissions.filter(s =>
    ['SYNCED_TO_NETSUITE', 'approved', 'submitted'].includes(s.status),
  ).length;
  const rejected = submissions.filter(s => s.status === 'rejected').length;
  const drafts = submissions.filter(s => s.status === 'draft').length;
  const approvalQueue = submissions.filter(s => s.status === 'pending').slice(0, 5);
  const recentSubmissions = submissions.slice(0, 8);

  let alertCount = 0;
  if (criticalPending > 0) alertCount += 1;
  if (syncFailed > 0) alertCount += 1;
  if (pendingApprovals > 0) alertCount += 1;
  if (rejected > 0) alertCount += 1;
  if (drafts > 0) alertCount += 1;

  return {
    pendingApprovals,
    criticalPending,
    syncFailed,
    completed,
    rejected,
    drafts,
    approvalQueue,
    recentSubmissions,
    alertCount,
  };
}

function submissionStatusLabel(status: string) {
  if (status === 'SYNCED_TO_NETSUITE') return 'Approved';
  if (status === 'pending') return 'Pending approval';
  if (status === 'rejected') return 'Rejected';
  if (status === 'draft') return 'Draft';
  if (status === 'NETSUITE_SYNC_FAILED') return 'Sync failed';
  return status;
}

export function DashboardAlerts({
  submissions,
  pendingApprovalsHref = '/submissions',
  scopeDescription,
  showDraftAlerts = false,
  showRejectedAlerts = false,
}: {
  submissions: Submission[];
  pendingApprovalsHref?: string;
  scopeDescription?: string;
  showDraftAlerts?: boolean;
  showRejectedAlerts?: boolean;
}) {
  const navigate = useNavigate();
  const {
    criticalPending,
    syncFailed,
    pendingApprovals,
    rejected,
    drafts,
    approvalQueue,
    alertCount,
  } = computeSubmissionMetrics(submissions);

  const hasAlerts =
    criticalPending > 0 ||
    syncFailed > 0 ||
    pendingApprovals > 0 ||
    (showRejectedAlerts && rejected > 0) ||
    (showDraftAlerts && drafts > 0);

  return (
    <Card>
      <CardHeader
        title="Alerts"
        badge={
          alertCount > 0 ? (
            <StatusBadge variant="pending">{alertCount} active</StatusBadge>
          ) : (
            <StatusBadge variant="synced">All clear</StatusBadge>
          )
        }
      />
      <div className="space-y-3">
        {!hasAlerts && (
          <AlertPanel
            severity="info"
            icon={Activity}
            title="No active alerts"
            description="Everything looks good. New issues will appear here."
          />
        )}
        {criticalPending > 0 && (
          <AlertPanel
            severity="critical"
            icon={AlertTriangle}
            title={`${criticalPending} critical approval${criticalPending > 1 ? 's' : ''} — overdue`}
            description={
              approvalQueue
                .slice(0, 2)
                .map(s => `SUB-${s.id.substring(0, 6).toUpperCase()}`)
                .join(', ') || scopeDescription
            }
          />
        )}
        {syncFailed > 0 && (
          <AlertPanel
            severity="warning"
            icon={RefreshCw}
            title={`${syncFailed} NetSuite sync failure${syncFailed > 1 ? 's' : ''}`}
            description="Review failed submissions and retry sync."
          />
        )}
        {pendingApprovals > 0 && (
          <AlertPanel
            severity="warning"
            title={`${pendingApprovals} submission${pendingApprovals > 1 ? 's' : ''} awaiting approval`}
            description={
              scopeDescription ||
              'Submissions waiting for approver action.'
            }
          />
        )}
        {showRejectedAlerts && rejected > 0 && (
          <AlertPanel
            severity="critical"
            icon={AlertTriangle}
            title={`${rejected} rejected submission${rejected > 1 ? 's' : ''}`}
            description="Review feedback and resubmit if needed."
          />
        )}
        {showDraftAlerts && drafts > 0 && (
          <AlertPanel
            severity="info"
            title={`${drafts} draft${drafts > 1 ? 's' : ''} in progress`}
            description="Resume and complete your saved form drafts."
          />
        )}
        {(pendingApprovals > 0 || syncFailed > 0) && (
          <button
            type="button"
            onClick={() => navigate(pendingApprovalsHref)}
            className="text-xs font-medium text-ns-blue hover:underline"
          >
            View submissions →
          </button>
        )}
      </div>
    </Card>
  );
}

export function RecentTransactionsCard({
  submissions,
  title = 'Recent transactions',
  emptyMessage = 'No recent transactions',
  onViewAll,
  viewAllLabel,
  showCreatedBy = true,
  showNetsuiteColumn = true,
}: {
  submissions: Submission[];
  title?: string;
  emptyMessage?: string;
  onViewAll?: () => void;
  viewAllLabel?: string;
  showCreatedBy?: boolean;
  showNetsuiteColumn?: boolean;
}) {
  const { recentSubmissions } = computeSubmissionMetrics(submissions);

  return (
    <Card padding="none">
      <div className="p-5 border-b border-ns-border">
        <CardHeader
          title={title}
          action={
            onViewAll ? (
              <button
                type="button"
                onClick={onViewAll}
                className="text-xs font-medium text-ns-blue hover:underline"
              >
                {viewAllLabel || 'View all'}
              </button>
            ) : undefined
          }
        />
      </div>
      <Table className="border-0 shadow-none rounded-none">
        <THead>
          <TR>
            <TH>Submission #</TH>
            <TH>Type</TH>
            {showCreatedBy && <TH>Created by</TH>}
            <TH>Status</TH>
            {showNetsuiteColumn && <TH>Sent to NetSuite</TH>}
          </TR>
        </THead>
        <TBody>
          {recentSubmissions.length === 0 ? (
            <TR>
              <TD colSpan={showCreatedBy && showNetsuiteColumn ? 5 : 4} className="text-center py-10 text-ns-text-muted">
                {emptyMessage}
              </TD>
            </TR>
          ) : (
            recentSubmissions.map(sub => (
              <TR key={sub.id}>
                <TD className="font-mono text-xs text-ns-text-muted">
                  SUB-{sub.id.substring(0, 6).toUpperCase()}
                </TD>
                <TD className="font-medium text-ns-text">{sub.formName || '—'}</TD>
                {showCreatedBy && <TD className="text-ns-text-muted">{sub.userName || '—'}</TD>}
                <TD>
                  <StatusBadge variant={submissionStatusVariant(sub.status)}>
                    {submissionStatusLabel(sub.status)}
                  </StatusBadge>
                </TD>
                {showNetsuiteColumn && (
                  <TD>
                    {sub.status === 'SYNCED_TO_NETSUITE' || sub.netsuiteId ? (
                      <StatusBadge variant="synced">Synced</StatusBadge>
                    ) : sub.status === 'NETSUITE_SYNC_FAILED' ? (
                      <StatusBadge variant="pending">Pending sync</StatusBadge>
                    ) : (
                      <span className="text-xs text-ns-text-muted">—</span>
                    )}
                  </TD>
                )}
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </Card>
  );
}

export function ApprovalQueueCard({
  submissions,
  onViewAll,
}: {
  submissions: Submission[];
  onViewAll?: () => void;
}) {
  const { approvalQueue, pendingApprovals } = computeSubmissionMetrics(submissions);

  return (
    <Card>
      <CardHeader
        title="Approval queue"
        badge={
          approvalQueue.length > 0 ? (
            <StatusBadge variant="pending">{pendingApprovals} pending</StatusBadge>
          ) : undefined
        }
        action={
          onViewAll ? (
            <button type="button" onClick={onViewAll} className="text-xs font-medium text-ns-blue hover:underline">
              View all
            </button>
          ) : undefined
        }
      />
      <div className="space-y-3">
        {approvalQueue.length === 0 ? (
          <p className="text-sm text-ns-text-muted py-4 text-center">No pending approvals</p>
        ) : (
          approvalQueue.map(sub => (
            <div
              key={sub.id}
              className="flex items-center justify-between py-2 border-b border-ns-border/60 last:border-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-ns-text truncate">{sub.formName}</p>
                <p className="text-xs text-ns-text-muted">
                  {sub.userName ? `${sub.userName} · ` : ''}Level {sub.currentLevel || 1}
                </p>
              </div>
              <StatusBadge variant="pending">Pending</StatusBadge>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

export function NetSuiteSyncCard({ submissions }: { submissions: Submission[] }) {
  const { pendingApprovals, syncFailed, completed } = computeSubmissionMetrics(submissions);

  return (
    <Card>
      <CardHeader
        title="NetSuite sync status"
        action={<RefreshCw size={14} className="text-ns-text-muted" />}
      />
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ns-text-muted">Synced / completed</span>
          <span className="font-semibold text-status-approved">{completed}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-ns-text-muted">Queue pending</span>
          <span className="font-semibold text-status-pending">{syncFailed + pendingApprovals}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-ns-text-muted">Connection status</span>
          <StatusBadge variant="synced" dot>
            Connected
          </StatusBadge>
        </div>
      </div>
    </Card>
  );
}
