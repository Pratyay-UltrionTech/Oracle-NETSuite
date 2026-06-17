import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import CustomerLayout from '../components/layout/CustomerLayout';
import { Button } from '../components/ui/Base';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Complex';
import { 
  FileText, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  PlayCircle,
  FileSearch
} from 'lucide-react';
import { PageHeader, KPICard, StatusBadge } from '../components/admin';

export default function CustomerDashboardPage() {
  const { user, forms, catalogues, fetchMyForms, isLoading } = useStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    fetchMyForms();
  }, [fetchMyForms]);

  const assignedForms = React.useMemo(() => (forms || []).filter(f => !!f), [forms]);

  const getSubmissionStatus = (form: any) => {
    if (!form) return 'not started';
    return form.status?.toLowerCase() || 'not started';
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || 'not started';
    switch (s) {
      case 'submitted':
        return <StatusBadge variant="approved">Submitted</StatusBadge>;
      case 'pending':
        return <StatusBadge variant="pending">Pending</StatusBadge>;
      case 'failed':
        return <StatusBadge variant="rejected">Failed</StatusBadge>;
      default:
        return <StatusBadge variant="draft">Not started</StatusBadge>;
    }
  };

  return (
    <CustomerLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Vendor overview"
          title={`Overview — ${user?.companyName || 'My company'}`}
          subtitle="Authorized transaction layouts pending your validation and submission."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <KPICard
            label="Pending forms"
            value={assignedForms.filter(f => getSubmissionStatus(f) !== 'submitted').length}
            subtext="Awaiting action"
            subtextVariant="warning"
            icon={FileSearch}
          />
          <KPICard
            label="Completed tasks"
            value={assignedForms.filter(f => getSubmissionStatus(f) === 'submitted').length}
            subtext="Submitted successfully"
            subtextVariant="success"
            icon={CheckCircle2}
          />
        </div>

        {/* Assignments Table */}
        <div className="bg-white rounded-ns-md border border-ns-border shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-ns-gray-bg border-b border-ns-border flex justify-between items-center">
            <span className="text-[10px] font-bold text-ns-navy uppercase tracking-[0.2em]">Assigned Transaction Profiles</span>
            <div className="flex gap-4 text-[10px] font-semibold text-ns-text-muted uppercase">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-ns-blue animate-pulse"/> Direct Entry Enabled</span>
            </div>
          </div>
          <Table>
            <THead>
              <TR>
                <TH>Transaction Profile</TH>
                <TH>Classification</TH>
                <TH className="text-center">Status</TH>
                <TH className="text-center">Current Level</TH>
                <TH>Last Synchronized</TH>
                <TH className="text-right px-6">Directives</TH>
              </TR>
            </THead>
            <TBody>
              {(assignedForms || []).map((form) => {
                if (!form || !form.id) return null;
                const status = getSubmissionStatus(form);
                const isSubmitted = status === 'submitted';
                
                return (
                  <TR key={form.id} className="group hover:bg-ns-light-blue/5 transition-all">
                    <TD className="py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-ns-gray-bg border border-ns-border rounded-ns-md flex items-center justify-center text-ns-navy/30 group-hover:bg-ns-blue group-hover:text-white transition-all">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-ns-navy">{form.name || 'Untitled Form'}</p>
                          <p className="text-[10px] font-medium text-ns-text-muted uppercase tracking-tighter mt-0.5">Reference: SYS-{form.id.substring(0, 6).toUpperCase()}</p>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      <span className="text-[10px] font-bold text-ns-navy/70 uppercase tracking-widest bg-ns-gray-bg px-2 py-1 rounded-xs">
                        {catalogues?.[form.transactionType as TransactionType]?.name || form.transactionType || 'Unknown'}
                      </span>
                    </TD>
                    <TD className="text-center">
                      {getStatusBadge(status)}
                    </TD>
                    <TD className="text-center">
                      {form.currentLevel ? (
                        <span className="text-[11px] font-bold text-ns-blue bg-ns-blue/5 px-2 py-0.5 rounded-ns-md border border-ns-blue/10">
                          Level {form.currentLevel}
                        </span>
                      ) : (
                        <span className="text-[10px] text-ns-text-muted italic">N/A</span>
                      )}
                    </TD>
                    <TD className="text-[11px] text-ns-text-muted font-semibold">
                      {form.updatedAt || 'N/A'}
                    </TD>
                    <TD className="px-6 text-right">
                      {status !== 'not started' ? (
                         <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-9 px-4 gap-2 text-[11px] opacity-60 cursor-not-allowed"
                            disabled
                          >
                            <CheckCircle2 size={14} /> Already Submitted
                          </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => navigate(`/fill/${form.id}`)}
                          className="h-9 px-5 gap-2 text-[11px] font-bold group/btn shadow-ns-blue/10 hover:shadow-lg transition-all"
                        >
                          Fill Form <ExternalLink size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                        </Button>
                      )}
                    </TD>
                  </TR>
                );
              })}
              {assignedForms.length === 0 && (
                <TR>
                  <TD colSpan={6} className="py-24 text-center">
                    <div className="flex flex-col items-center max-w-sm mx-auto">
                      <div className="w-16 h-16 bg-ns-gray-bg rounded-full flex items-center justify-center text-ns-text-muted/40 mb-4 border border-dashed border-ns-border">
                        <AlertCircle size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-ns-navy">Zero Assignments Found</h3>
                      <p className="text-sm text-ns-text-muted mt-2">Your profile currently has no authorized transaction forms pending. Please contact your system administrator for provisioning.</p>
                    </div>
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
          
          <div className="px-6 py-4 bg-ns-gray-bg border-t border-ns-border flex justify-center">
            <p className="text-[9px] text-ns-text-muted font-bold tracking-widest uppercase">END OF AUTHORIZED LIST — SECURE TRANSMISSION ESTABLISHED</p>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
