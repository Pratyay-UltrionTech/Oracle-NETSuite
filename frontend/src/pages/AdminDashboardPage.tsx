import * as React from 'react';
import { useStore } from '../store/useStore';
import AdminLayout from '../components/layout/AdminLayout';
import {
  Building2,
  FileText,
  Users,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  KPICard,
  PageHeader,
  Card,
  CardHeader,
  StatusBadge,
} from '../components/admin';
import {
  ApprovalQueueCard,
  DashboardAlerts,
  NetSuiteSyncCard,
  RecentTransactionsCard,
  computeSubmissionMetrics,
} from '../components/dashboard/DashboardSections';

export default function AdminDashboardPage() {
  const {
    user,
    companies,
    users,
    forms,
    submissions,
    myAssignedForms,
    fetchCompanies,
    fetchUsers,
    fetchForms,
    fetchSubmissions,
    fetchMyAssignedForms,
  } = useStore();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role === 'super_admin';
  const isClientAdmin = user?.role === 'client_admin';

  React.useEffect(() => {
    if (isSuperAdmin) {
      fetchCompanies();
      fetchUsers();
      fetchForms();
      fetchSubmissions();
    } else if (isClientAdmin) {
      fetchUsers();
      fetchForms(user?.companyId);
      fetchSubmissions();
      fetchMyAssignedForms();
    }
  }, [
    isSuperAdmin,
    isClientAdmin,
    user?.companyId,
    fetchCompanies,
    fetchUsers,
    fetchForms,
    fetchSubmissions,
    fetchMyAssignedForms,
  ]);

  const myAssigned = React.useMemo(
    () => (myAssignedForms || []).filter(f => !!f),
    [myAssignedForms],
  );

  const metrics = computeSubmissionMetrics(submissions);
  const companyUsers = users.filter(u => u.companyId === user?.companyId);

  if (isSuperAdmin) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader
            eyebrow="Operations overview"
            title="Operations overview"
            subtitle="Track submissions, approvals, and NetSuite sync status across your organization."
            actions={
              <StatusBadge variant="synced" dot>
                Connected to NetSuite
              </StatusBadge>
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KPICard
              label="Purchase requests awaiting approval"
              value={metrics.pendingApprovals}
              subtext={metrics.criticalPending > 0 ? `${metrics.criticalPending} overdue` : 'On track'}
              subtextVariant={metrics.criticalPending > 0 ? 'warning' : 'success'}
              onClick={() => navigate('/submissions')}
            />
            <KPICard
              label="Active forms"
              value={forms.length}
              subtext={`${new Set(forms.map(f => f.transactionType)).size} transaction types`}
              subtextVariant="success"
              icon={FileText}
              onClick={() => navigate('/forms')}
            />
            <KPICard
              label="Companies"
              value={companies.length}
              subtext={`${users.filter(u => u.isActive).length} active users`}
              subtextVariant="info"
              icon={Building2}
              onClick={() => navigate('/companies')}
            />
            <KPICard
              label="Total submissions"
              value={submissions.length}
              subtext={`${metrics.completed} completed`}
              subtextVariant="info"
              icon={CheckCircle2}
              onClick={() => navigate('/submissions')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentTransactionsCard
                submissions={submissions}
                onViewAll={() => navigate('/submissions')}
                viewAllLabel={`${forms.length} transaction types active`}
              />
            </div>
            <div className="space-y-6">
              <ApprovalQueueCard submissions={submissions} onViewAll={() => navigate('/submissions')} />
              <NetSuiteSyncCard submissions={submissions} />
            </div>
          </div>

          <DashboardAlerts
            submissions={submissions}
            scopeDescription="Submissions awaiting approver action across all companies."
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Company overview"
          title={`${user?.companyName || 'Company'} overview`}
          subtitle="Track submissions, approvals, and NetSuite sync status for your organization."
          actions={
            <StatusBadge variant="synced" dot>
              Connected to NetSuite
            </StatusBadge>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KPICard
            label="Awaiting approval"
            value={metrics.pendingApprovals}
            subtext={metrics.criticalPending > 0 ? `${metrics.criticalPending} overdue` : 'On track'}
            subtextVariant={metrics.criticalPending > 0 ? 'warning' : 'success'}
            icon={Clock}
            onClick={() => navigate('/submissions')}
          />
          <KPICard
            label="Active forms"
            value={forms.length}
            subtext={`${new Set(forms.map(f => f.transactionType)).size} transaction types`}
            subtextVariant="success"
            icon={FileText}
            onClick={() => navigate('/assign-forms')}
          />
          <KPICard
            label="Team members"
            value={companyUsers.length}
            subtext={`${companyUsers.filter(u => u.isActive !== false).length} active users`}
            subtextVariant="info"
            icon={Users}
            onClick={() => navigate('/employees')}
          />
          <KPICard
            label="Total submissions"
            value={submissions.length}
            subtext={`${metrics.completed} completed`}
            subtextVariant="info"
            icon={CheckCircle2}
            onClick={() => navigate('/submissions')}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RecentTransactionsCard
              submissions={submissions}
              title="Recent team submissions"
              emptyMessage="No recent submissions from your team"
              onViewAll={() => navigate('/submissions')}
              viewAllLabel="View all submissions"
            />

            {myAssigned.length > 0 && (
              <Card padding="none">
                <div className="p-5 border-b border-ns-border flex items-center justify-between gap-4">
                  <CardHeader
                    title="My assigned forms"
                    subtitle="Forms you can fill and submit"
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
                  {myAssigned.slice(0, 4).map(form => (
                    <div
                      key={form.id}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-ns-blue-soft/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-ns-blue-soft border border-ns-border rounded-ns-md flex items-center justify-center text-ns-blue font-bold text-[10px] shrink-0">
                          {form.transactionType.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ns-text truncate">{form.name}</p>
                          <p className="text-xs text-ns-text-muted capitalize">
                            {form.transactionType.replace(/_/g, ' ')}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/fill/${form.id}`)}
                        className="text-xs font-semibold text-ns-blue hover:underline whitespace-nowrap"
                      >
                        Fill form
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <ApprovalQueueCard submissions={submissions} onViewAll={() => navigate('/submissions')} />
            <NetSuiteSyncCard submissions={submissions} />
          </div>
        </div>

        <DashboardAlerts
          submissions={submissions}
          scopeDescription="Submissions from your team awaiting approver action."
        />
      </div>
    </AdminLayout>
  );
}
