import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import PortalLayout from '../components/layout/PortalLayout';
import CustomerLayout from '../components/layout/CustomerLayout';
import { Button } from '../components/ui/Base';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Complex';
import { FileText, FileSearch, Loader2 } from 'lucide-react';
import { PageHeader, StatusBadge, Card } from '../components/admin';
import { TRANSACTION_REGISTRY } from '../lib/transactionRegistry';
import type { Submission, TransactionType } from '../types';

function transactionLabel(type: string | undefined): string {
  if (!type) return '—';
  const meta = TRANSACTION_REGISTRY[type as TransactionType];
  return meta?.name ?? type.replace(/_/g, ' ');
}

export default function UserDraftsPage() {
  const { user, mySubmissions, fetchMySubmissions, fetchMyFormDetails } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [resumingFormId, setResumingFormId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMySubmissions()
      .then(() => {
        if (!cancelled) setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchMySubmissions]);

  const draftSubmissions = mySubmissions.filter(
    (sub: Submission & { transactionType?: string }) => sub.status?.toLowerCase() === 'draft',
  );

  const Layout = user?.role === 'client_admin' ? PortalLayout : CustomerLayout;

  const resumeDraft = async (formId: string) => {
    setResumingFormId(formId);
    try {
      await fetchMyFormDetails(formId);
      navigate(`/user/forms/${formId}/new`);
    } finally {
      setResumingFormId(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="My workspace"
          title="Drafts"
          subtitle="Saved progress across all your forms — resume and complete when ready."
        />

        <Card padding="none">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-ns-text-muted text-sm">
              <Loader2 size={18} className="animate-spin text-ns-blue" />
              Loading drafts…
            </div>
          ) : (
            <Table className="border-0 shadow-none rounded-none">
              <THead>
                <TR>
                  <TH>Form name</TH>
                  <TH>Transaction type</TH>
                  <TH className="text-center">Status</TH>
                  <TH>Last saved</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {draftSubmissions.map((sub: Submission & { transactionType?: string }) => (
                  <TR key={sub.id}>
                    <TD>
                      <p className="text-sm font-semibold text-ns-text">{sub.formName}</p>
                      <p className="text-xs text-ns-text-muted">DRF-{sub.id.substring(0, 6).toUpperCase()}</p>
                    </TD>
                    <TD className="text-sm text-ns-text">{transactionLabel(sub.transactionType)}</TD>
                    <TD className="text-center">
                      <StatusBadge variant="draft" dot>
                        Draft
                      </StatusBadge>
                    </TD>
                    <TD className="text-xs text-ns-text-muted">
                      {sub.submittedAt
                        ? new Date(sub.submittedAt).toLocaleString()
                        : sub.updatedAt
                          ? new Date(sub.updatedAt).toLocaleString()
                          : '—'}
                    </TD>
                    <TD className="text-right">
                      <Button
                        size="sm"
                        className="gap-2"
                        disabled={resumingFormId === sub.formId}
                        onClick={() => void resumeDraft(sub.formId)}
                      >
                        {resumingFormId === sub.formId ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <FileText size={14} />
                        )}
                        {resumingFormId === sub.formId ? 'Opening…' : 'Resume'}
                      </Button>
                    </TD>
                  </TR>
                ))}
                {draftSubmissions.length === 0 && (
                  <TR>
                    <TD colSpan={5} className="py-16 text-center">
                      <FileSearch size={32} className="mx-auto text-ns-text-muted/30 mb-3" />
                      <p className="text-sm text-ns-text-muted">No drafts yet.</p>
                      <p className="text-xs text-ns-text-muted mt-1">
                        Use Save Progress while filling a form to save it here.
                      </p>
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </Layout>
  );
}
