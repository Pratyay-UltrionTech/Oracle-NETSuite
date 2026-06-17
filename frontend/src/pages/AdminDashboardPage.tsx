import * as React from 'react';
import { useStore } from '../store/useStore';
import AdminLayout from '../components/layout/AdminLayout';
import {
  Building2,
  FileText,
  Users,
  CheckCircle2,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Clock,
  Briefcase,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Inbox,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  KPICard,
  PageHeader,
  Card,
  CardHeader,
  StatusBadge,
  AlertPanel,
  submissionStatusVariant,
} from '../components/admin';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Complex';

export default function AdminDashboardPage() {
  const { user, companies, users, forms, submissions, fetchCompanies, fetchUsers, fetchForms, fetchSubmissions } = useStore();
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
    }
  }, [isSuperAdmin, isClientAdmin, user?.companyId, fetchCompanies, fetchUsers, fetchForms, fetchSubmissions]);

  const pendingApprovals = submissions.filter(s => s.status === 'pending').length;
  const criticalPending = submissions.filter(
    s => s.status === 'pending' && s.currentLevel && s.currentLevel > 2,
  ).length;
  const syncFailed = submissions.filter(s => s.status === 'NETSUITE_SYNC_FAILED').length;
  const recentSubmissions = submissions.slice(0, 8);
  const approvalQueue = submissions.filter(s => s.status === 'pending').slice(0, 5);

  if (isSuperAdmin) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader
            eyebrow="Operations overview"
            title="Operations overview"
            subtitle="Monitoring ecosystem health, corporate synchronization, and transaction lifecycle metrics."
            actions={
              <StatusBadge variant="synced" dot>
                NetSuite Live
              </StatusBadge>
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KPICard
              label="Open PRs awaiting approval"
              value={pendingApprovals}
              subtext={criticalPending > 0 ? `${criticalPending} past SLA threshold` : 'On track'}
              subtextVariant={criticalPending > 0 ? 'warning' : 'success'}
              onClick={() => navigate('/submissions')}
            />
            <KPICard
              label="Active purchase orders"
              value={forms.filter(f => f.transactionType === 'purchase_order').length}
              subtext="On track"
              subtextVariant="success"
              icon={FileText}
              onClick={() => navigate('/forms')}
            />
            <KPICard
              label="Partner companies"
              value={companies.length}
              subtext={`${users.filter(u => u.isActive).length} active users`}
              subtextVariant="info"
              icon={Building2}
              onClick={() => navigate('/companies')}
            />
            <KPICard
              label="Open support tickets"
              value={syncFailed || submissions.filter(s => s.status === 'rejected').length}
              subtext={syncFailed > 0 ? `${syncFailed} sync failures` : 'No critical issues'}
              subtextVariant={syncFailed > 0 ? 'danger' : 'neutral'}
              icon={Inbox}
              onClick={() => navigate('/submissions')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card padding="none">
                <div className="p-5 border-b border-ns-border">
                  <CardHeader
                    title="Recent transactions"
                    action={
                      <button
                        onClick={() => navigate('/submissions')}
                        className="text-xs font-medium text-ns-blue hover:underline"
                      >
                        {forms.length} transaction types active
                      </button>
                    }
                  />
                </div>
                <Table className="border-0 shadow-none rounded-none">
                  <THead>
                    <TR>
                      <TH>TX #</TH>
                      <TH>Type</TH>
                      <TH>Created by</TH>
                      <TH>Status</TH>
                      <TH>NetSuite sync</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {recentSubmissions.length === 0 ? (
                      <TR>
                        <TD colSpan={5} className="text-center py-10 text-ns-text-muted">
                          No recent transactions
                        </TD>
                      </TR>
                    ) : (
                      recentSubmissions.map(sub => (
                        <TR key={sub.id}>
                          <TD className="font-mono text-xs text-ns-text-muted">
                            SUB-{sub.id.substring(0, 6).toUpperCase()}
                          </TD>
                          <TD className="font-medium text-ns-text">{sub.formName || '—'}</TD>
                          <TD className="text-ns-text-muted">{sub.userName || '—'}</TD>
                          <TD>
                            <StatusBadge variant={submissionStatusVariant(sub.status)}>
                              {sub.status === 'SYNCED_TO_NETSUITE'
                                ? 'Approved'
                                : sub.status === 'pending'
                                  ? 'Pending approval'
                                  : sub.status === 'rejected'
                                    ? 'Rejected'
                                    : sub.status === 'draft'
                                      ? 'Draft'
                                      : sub.status}
                            </StatusBadge>
                          </TD>
                          <TD>
                            {sub.status === 'SYNCED_TO_NETSUITE' || sub.netsuiteId ? (
                              <StatusBadge variant="synced">Synced</StatusBadge>
                            ) : sub.status === 'NETSUITE_SYNC_FAILED' ? (
                              <StatusBadge variant="pending">Queued</StatusBadge>
                            ) : (
                              <span className="text-xs text-ns-text-muted">—</span>
                            )}
                          </TD>
                        </TR>
                      ))
                    )}
                  </TBody>
                </Table>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader
                  title="Approval queue"
                  badge={
                    approvalQueue.length > 0 ? (
                      <StatusBadge variant="pending">{approvalQueue.length} pending</StatusBadge>
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
                          <p className="text-xs text-ns-text-muted">Level {sub.currentLevel || 1}</p>
                        </div>
                        <StatusBadge variant="pending">Pending</StatusBadge>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card>
                <CardHeader
                  title="NetSuite sync status"
                  action={<RefreshCw size={14} className="text-ns-text-muted" />}
                />
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ns-text-muted">Synced today</span>
                    <span className="font-semibold text-status-approved">
                      {submissions.filter(s => s.status === 'SYNCED_TO_NETSUITE' || s.status === 'approved').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ns-text-muted">Queue pending</span>
                    <span className="font-semibold text-status-pending">{syncFailed + pendingApprovals}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ns-text-muted">Connectors active</span>
                    <StatusBadge variant="synced" dot>
                      Live
                    </StatusBadge>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader
              title="System alerts"
              badge={<StatusBadge variant="pending">5 active</StatusBadge>}
            />
            <div className="space-y-3">
              {criticalPending > 0 && (
                <AlertPanel
                  severity="critical"
                  icon={AlertTriangle}
                  title={`${criticalPending} critical approvals — SLA breach imminent`}
                  description={approvalQueue
                    .slice(0, 2)
                    .map(s => `SUB-${s.id.substring(0, 6).toUpperCase()}`)
                    .join(', ')}
                />
              )}
              {syncFailed > 0 && (
                <AlertPanel
                  severity="warning"
                  icon={RefreshCw}
                  title={`${syncFailed} NetSuite sync failures`}
                  description="Review failed submissions in audit logs and retry sync."
                />
              )}
              {pendingApprovals > 0 && (
                <AlertPanel
                  severity="warning"
                  title={`${pendingApprovals} PRs past approval SLA`}
                  description="Transactions awaiting approver action across all entities."
                />
              )}
              <AlertPanel
                severity="info"
                icon={Activity}
                title="NetSuite sync queue — items pending"
                description={`${pendingApprovals + syncFailed} items in processing queue · INT-07`}
              />
            </div>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const stats = [
    {
      label: 'My Entity',
      value: 1,
      icon: Building2,
      trend: 'Active',
      path: '/profile',
    },
    {
      label: 'Active Protocols',
      value: forms.length,
      icon: FileText,
      trend: '+5%',
      path: '/assign-forms',
    },
    {
      label: 'Entity Personnel',
      value: users.filter(u => u.companyId === user?.companyId).length,
      icon: Users,
      trend: '+8%',
      path: '/employees',
    },
    {
      label: 'Total Submissions',
      value: submissions.length,
      icon: CheckCircle2,
      trend: '+24%',
      path: '/submissions',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-10 pb-12">
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 text-ns-blue mb-1">
              <ShieldCheck size={16} className="animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Entity Command Protocol</span>
            </div>
            <h1 className="text-3xl font-black text-ns-text tracking-tight">
              {user?.companyName || 'Entity'} Command Center
            </h1>
            <p className="text-sm text-ns-text-muted mt-2 max-w-lg">
              Managing organizational workflows, employee authorization, and form processing synchronization.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              onClick={() => navigate(stat.path)}
              className="bg-white p-6 rounded-ns-md border border-ns-border ns-panel-shadow group hover:border-ns-blue transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-ns-md bg-ns-blue/10 text-ns-blue">
                  <stat.icon size={20} />
                </div>
                <span
                  className={cn(
                    'text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1',
                    stat.trend.includes('%') ? 'text-status-approved bg-status-approved-bg' : 'text-ns-blue bg-ns-blue/5',
                  )}
                >
                  {stat.trend.includes('%') && <TrendingUp size={10} />} {stat.trend}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-[10px] font-bold text-ns-text-muted uppercase tracking-widest">{stat.label}</h3>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-ns-navy">{stat.value}</p>
                  <ArrowUpRight size={14} className="text-gray-300 group-hover:text-ns-blue transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-ns-text uppercase tracking-[0.2em] flex items-center gap-2">
                <Briefcase size={14} className="text-ns-blue" />
                Active Personnel Protocols
              </h3>
              <button
                onClick={() => navigate('/assign-forms')}
                className="text-[10px] font-bold text-ns-blue hover:underline uppercase tracking-widest"
              >
                View All
              </button>
            </div>
            <div className="bg-white rounded-ns-md border border-ns-border ns-panel-shadow overflow-hidden">
              <div className="divide-y divide-ns-border/60">
                {forms.slice(0, 5).map(form => (
                  <div
                    key={form.id}
                    className="p-5 flex items-center justify-between hover:bg-ns-light-blue/5 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-ns-gray-bg border border-ns-border rounded-ns-md flex items-center justify-center text-ns-navy/40 font-bold text-xs">
                        {form.transactionType.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-ns-text group-hover:text-ns-blue transition-colors">
                          {form.name}
                        </p>
                        <p className="text-[10px] text-ns-text-muted font-medium uppercase tracking-wider">
                          {form.transactionType.replace('_', ' ')} • Assigned to {form.assignedTo?.length || 0} users
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {forms.length === 0 && (
                  <div className="p-12 text-center text-ns-text-muted flex flex-col items-center">
                    <Activity size={32} className="opacity-20 mb-3" />
                    <p className="text-xs font-bold uppercase tracking-widest">No active forms detected</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-ns-text uppercase tracking-[0.2em] flex items-center gap-2">
              <Clock size={14} className="text-ns-blue" />
              Pulse Audit Log
            </h3>
            <div className="bg-white p-6 rounded-ns-md border border-ns-border ns-panel-shadow min-h-[400px]">
              <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-px before:bg-ns-page-bg">
                {submissions.slice(0, 6).map((sub, idx) => (
                  <div key={idx} className="relative pl-8">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border border-ns-border flex items-center justify-center z-10">
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full',
                          sub.status === 'approved' ? 'bg-status-approved-bg0' : sub.status === 'rejected' ? 'bg-status-rejected-bg0' : 'bg-ns-blue',
                        )}
                      />
                    </div>
                    <p className="text-[11px] font-bold text-ns-text">
                      {sub.status === 'approved' ? 'Sync Successful' : sub.status === 'rejected' ? 'Protocol Denied' : 'Submission Recorded'}
                    </p>
                    <p className="text-[10px] text-ns-text-muted mt-0.5 leading-relaxed">
                      {sub.userName} submitted <span className="text-ns-navy font-bold">{sub.formName}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
