import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import PortalLayout from '../components/layout/PortalLayout';
import { Button } from '../components/ui/Base';
import {
  FileText,
  ExternalLink,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
} from 'lucide-react';
import {
  KPICard,
  PageHeader,
  Card,
  CardHeader,
  StatusBadge,
  AlertPanel,
} from '../components/admin';
import {
  ApprovalQueueCard,
  DashboardAlerts,
  NetSuiteSyncCard,
  RecentTransactionsCard,
  computeSubmissionMetrics,
} from '../components/dashboard/DashboardSections';
import { TransactionType } from '../types';

export default function CustomerDashboardPage() {
  const {
    user,
    myAssignedForms,
    mySubmissions,
    catalogues,
    fetchMyAssignedForms,
    fetchMySubmissions,
    fetchMyStats,
    fetchPendingApprovals,
    isLoading,
  } = useStore();
  const navigate = useNavigate();

  const [stats, setStats] = React.useState<{
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    drafts: number;
  } | null>(null);
  const [pendingApprovals, setPendingApprovals] = React.useState<typeof mySubmissions>([]);

  React.useEffect(() => {
    void fetchMyAssignedForms();
    void fetchMySubmissions();
    void fetchMyStats().then(setStats);
    void fetchPendingApprovals().then(setPendingApprovals);
  }, [fetchMyAssignedForms, fetchMySubmissions, fetchMyStats, fetchPendingApprovals]);

  const assignedForms = React.useMemo(
    () => (myAssignedForms || []).filter(f => !!f),
    [myAssignedForms],
  );

  const metrics = computeSubmissionMetrics(mySubmissions);
  const isApprover = pendingApprovals.length > 0;

  const getSubmissionStatus = (form: { status?: string }) =>
    form.status?.toLowerCase() || 'not started';

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || 'not started';
    switch (s) {
      case 'draft':
        return <StatusBadge variant="draft">Draft</StatusBadge>;
      case 'submitted':
        return <StatusBadge variant="approved">Submitted</StatusBadge>;
      case 'pending':
        return <StatusBadge variant="pending">Pending</StatusBadge>;
      case 'failed':
      case 'rejected':
        return <StatusBadge variant="rejected">Rejected</StatusBadge>;
      default:
        return <StatusBadge variant="draft">Not started</StatusBadge>;
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="My workspace"
          title={`Welcome back${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
          subtitle="Track your form submissions, approvals, and NetSuite sync status."
          actions={
            <StatusBadge variant="synced" dot>
              Connected to NetSuite
            </StatusBadge>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KPICard
            label="Assigned forms"
            value={assignedForms.length}
            subtext="Available to you"
            subtextVariant="info"
            icon={FileText}
            onClick={() => navigate('/my-forms')}
          />
          <KPICard
            label="My submissions"
            value={stats?.total ?? metrics.completed + metrics.pendingApprovals + metrics.rejected}
            subtext={`${stats?.approved ?? metrics.completed} completed`}
            subtextVariant="success"
            icon={CheckCircle2}
          />
          <KPICard
            label="Pending review"
            value={stats?.pending ?? metrics.pendingApprovals}
            subtext={metrics.pendingApprovals > 0 ? 'Awaiting approval' : 'None in queue'}
            subtextVariant={metrics.pendingApprovals > 0 ? 'warning' : 'success'}
            icon={Clock}
          />
          <KPICard
            label="Drafts in progress"
            value={stats?.drafts ?? metrics.drafts}
            subtext={metrics.drafts > 0 ? 'Resume to complete' : 'No drafts saved'}
            subtextVariant={metrics.drafts > 0 ? 'warning' : 'neutral'}
            icon={PlayCircle}
            onClick={() => navigate('/drafts')}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RecentTransactionsCard
              submissions={mySubmissions}
              title="My recent submissions"
              emptyMessage="No submissions yet — open a form below to get started."
              showCreatedBy={false}
            />

            <Card padding="none">
              <div className="p-5 border-b border-ns-border flex items-center justify-between gap-4">
                <CardHeader
                  title="Assigned forms"
                  subtitle="Forms you can open and submit"
                  className="mb-0"
                />
                <button
                  type="button"
                  onClick={() => navigate('/my-forms')}
                  className="text-xs font-medium text-ns-blue hover:underline whitespace-nowrap"
                >
                  View all
                </button>
              </div>
              <div className="divide-y divide-ns-border/60">
                {assignedForms.length === 0 && !isLoading ? (
                  <div className="p-12 text-center text-ns-text-muted flex flex-col items-center">
                    <AlertCircle size={32} className="opacity-30 mb-3" />
                    <p className="text-xs font-medium">No assigned forms</p>
                    <p className="text-xs mt-1 max-w-xs">
                      Use the Transactions links in the sidebar when forms are assigned to you.
                    </p>
                  </div>
                ) : (
                  assignedForms.slice(0, 6).map(form => {
                    if (!form?.id) return null;
                    const status = getSubmissionStatus(form);
                    const isDraft = status === 'draft';
                    const isSubmitted = status !== 'not started' && !isDraft;

                    return (
                      <div
                        key={form.id}
                        className="p-4 flex items-center justify-between gap-4 hover:bg-ns-blue-soft/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 bg-ns-blue-soft border border-ns-border rounded-ns-md flex items-center justify-center text-ns-blue shrink-0">
                            <FileText size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-ns-text truncate">{form.name || 'Untitled form'}</p>
                            <p className="text-xs text-ns-text-muted">
                              {catalogues?.[form.transactionType as TransactionType]?.name ||
                                form.transactionType?.replace(/_/g, ' ') ||
                                'Form'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {getStatusBadge(status)}
                          {isSubmitted ? (
                            <Button variant="secondary" size="sm" disabled className="gap-2 opacity-60">
                              <CheckCircle2 size={14} />
                              Submitted
                            </Button>
                          ) : isDraft ? (
                            <Button size="sm" onClick={() => navigate(`/fill/${form.id}`)} className="gap-2">
                              <PlayCircle size={14} />
                              Resume
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => navigate(`/fill/${form.id}`)} className="gap-2">
                              Fill form
                              <ExternalLink size={14} />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {isApprover && (
              <ApprovalQueueCard
                submissions={pendingApprovals}
                onViewAll={() => navigate('/submissions')}
              />
            )}

            <NetSuiteSyncCard submissions={mySubmissions} />

            <Card>
              <CardHeader title="Quick status" subtitle="Your submission breakdown" />
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ns-text-muted">Completed</span>
                  <span className="font-semibold text-status-approved">{stats?.approved ?? metrics.completed}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ns-text-muted">Pending approval</span>
                  <span className="font-semibold text-status-pending">{stats?.pending ?? metrics.pendingApprovals}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ns-text-muted">Rejected</span>
                  <span className="font-semibold text-status-rejected">{stats?.rejected ?? metrics.rejected}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ns-text-muted">Saved drafts</span>
                  <span className="font-semibold text-ns-text">{stats?.drafts ?? metrics.drafts}</span>
                </div>
              </div>
            </Card>

            {isApprover && (
              <Card>
                <CardHeader title="Your approvals" badge={<StatusBadge variant="pending">{pendingApprovals.length}</StatusBadge>} />
                <AlertPanel
                  severity="warning"
                  title="Submissions need your review"
                  description="You are assigned as an approver on pending submissions."
                />
              </Card>
            )}
          </div>
        </div>

        <DashboardAlerts
          submissions={mySubmissions}
          pendingApprovalsHref="/customer-dashboard"
          scopeDescription="Your submissions awaiting approver action."
          showDraftAlerts
          showRejectedAlerts
        />
      </div>
    </PortalLayout>
  );
}
