import * as React from 'react';
import { useStore } from '../store/useStore';
import AdminLayout from '../components/layout/AdminLayout';
import { Button, Input, Label } from '../components/ui/Base';
import { Table, THead, TBody, TR, TH, TD, Modal, ConfirmModal } from '../components/ui/Complex';
import { Building2, Plus, Users, Search, Trash2, GitBranch, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, KPICard, Card } from '../components/admin';
import { CompanyLogoField } from '../components/admin/CompanyLogoField';
import { CompanyLogo } from '../components/brand/CompanyLogo';
import type { Company } from '../types';

type CompanyFormState = {
  name: string;
  logoFile: File | null;
  logoPreview: string | null;
  removeLogo: boolean;
};

const emptyForm = (): CompanyFormState => ({
  name: '',
  logoFile: null,
  logoPreview: null,
  removeLogo: false,
});

export default function CompaniesPage() {
  const {
    companies,
    users,
    addCompany,
    updateCompany,
    uploadCompanyLogo,
    removeCompanyLogo,
    deleteCompany,
    fetchCompanies,
    fetchUsers,
  } = useStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editCompany, setEditCompany] = React.useState<Company | null>(null);
  const [form, setForm] = React.useState<CompanyFormState>(emptyForm);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetchCompanies();
    fetchUsers();
  }, [fetchCompanies, fetchUsers]);

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getEmployeeCount = (companyId: string) => users.filter(u => u.companyId === companyId).length;
  const totalEmployees = companies.reduce((acc, c) => acc + getEmployeeCount(c.id), 0);

  const openCreate = () => {
    setForm(emptyForm());
    setIsCreateOpen(true);
  };

  const openEdit = (company: Company) => {
    setForm({
      name: company.name,
      logoFile: null,
      logoPreview: null,
      removeLogo: false,
    });
    setEditCompany(company);
  };

  const closeModals = () => {
    setIsCreateOpen(false);
    setEditCompany(null);
    setForm(emptyForm());
  };

  const applyLogoChanges = async (companyId: string) => {
    if (form.removeLogo) {
      await removeCompanyLogo(companyId);
    }
    if (form.logoFile) {
      await uploadCompanyLogo(companyId, form.logoFile);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await addCompany(form.name.trim(), form.logoFile);
      closeModals();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editCompany || !form.name.trim()) return;
    setSaving(true);
    try {
      if (form.name.trim() !== editCompany.name) {
        await updateCompany(editCompany.id, form.name.trim());
      }
      await applyLogoChanges(editCompany.id);
      closeModals();
    } finally {
      setSaving(false);
    }
  };

  const renderCompanyForm = (isEdit: boolean) => (
    <div className="space-y-4">
      <p className="text-xs text-ns-text-muted leading-relaxed italic border-l-2 border-ns-blue pl-3 py-1 bg-ns-blue/5">
        {isEdit
          ? 'Update the company name or replace its logo. The logo appears in the sidebar for that company’s admins and users.'
          : 'Each company has separate data and its own user roles and form assignments.'}
      </p>
      <div>
        <Label mandatory>Official company name</Label>
        <Input
          autoFocus
          placeholder="e.g. Acme Corp India Pvt Ltd"
          value={form.name}
          onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
        />
      </div>
      <CompanyLogoField
        companyName={form.name || 'Company'}
        existingLogoUrl={isEdit ? editCompany?.logoUrl : undefined}
        file={form.logoFile}
        previewUrl={form.logoPreview}
        onFileChange={(logoFile, logoPreview) => setForm(prev => ({ ...prev, logoFile, logoPreview }))}
        removeExisting={form.removeLogo}
        onRemoveExistingChange={removeLogo => setForm(prev => ({ ...prev, removeLogo }))}
      />
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Organization management"
          title="Company management"
          subtitle="Manage companies and their users."
          actions={
            <Button onClick={openCreate} className="gap-2">
              <Plus size={18} />
              Register company
            </Button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KPICard label="Total companies" value={companies.length} subtext="Active companies" subtextVariant="info" />
          <KPICard label="Total employees" value={totalEmployees} subtext="Across all companies" subtextVariant="neutral" />
          <KPICard
            label="Avg. staff per company"
            value={companies.length ? Math.round(totalEmployees / companies.length) : 0}
            subtext="Average team size"
            subtextVariant="neutral"
          />
        </div>

        <Card padding="md">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 text-ns-text-muted" size={14} />
            <Input
              placeholder="Search by company name…"
              className="pl-9"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </Card>

        <Table>
          <THead>
            <TR>
              <TH className="w-16 text-center">ID</TH>
              <TH>Company</TH>
              <TH className="text-center">Staff Count</TH>
              <TH>Establishment Date</TH>
              <TH className="text-right px-6">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {filteredCompanies.map((company, index) => (
              <TR key={company.id} className="group transition-all hover:bg-ns-light-blue/10">
                <TD className="text-center text-ns-text-muted font-mono text-[11px]">{index + 1}</TD>
                <TD className="py-4">
                  <div className="flex items-center gap-3">
                    <CompanyLogo companyName={company.name} logoUrl={company.logoUrl} variant="table" />
                    <div>
                      <button
                        onClick={() => navigate(`/companies/${company.id}`)}
                        className="text-sm font-bold text-ns-text group-hover:text-ns-blue transition-colors text-left block"
                      >
                        {company.name}
                      </button>
                      <span className="text-[10px] text-ns-text-muted font-mono tracking-tighter uppercase">{company.id}</span>
                    </div>
                  </div>
                </TD>
                <TD className="text-center">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-status-synced-bg text-status-synced text-xs font-semibold border border-status-synced/20">
                    <Users size={10} />
                    {getEmployeeCount(company.id)} employees
                  </span>
                </TD>
                <TD className="text-[11px] text-ns-text-muted font-semibold">
                  {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : '—'}
                </TD>
                <TD className="px-6">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEdit(company)}
                      className="h-8 px-3 gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                    >
                      Edit <Pencil size={12} />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/companies/${company.id}`)}
                      className="h-8 px-3 gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                    >
                      Staff <Users size={12} />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/companies/${company.id}/workflow`)}
                      className="h-8 px-3 gap-1.5 text-[10px] font-bold uppercase tracking-widest border-ns-blue text-ns-blue hover:bg-ns-blue hover:text-white"
                    >
                      Workflow <GitBranch size={12} />
                    </Button>
                    <Button
                      variant="iconDanger"
                      size="icon"
                      onClick={() => setDeleteId(company.id)}
                      className="h-8 w-8 rounded-full"
                      title="Delete company"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
            {filteredCompanies.length === 0 && (
              <TR>
                <TD colSpan={5} className="py-20 text-center bg-white">
                  <div className="opacity-40 flex flex-col items-center">
                    <Building2 size={40} className="mb-4 text-ns-navy" />
                    <p className="text-sm font-bold uppercase tracking-[0.2em]">No companies found</p>
                    <p className="text-xs mt-2">Adjust your search or add a new company.</p>
                  </div>
                </TD>
              </TR>
            )}
          </TBody>
        </Table>

        <Modal
          isOpen={isCreateOpen}
          onClose={closeModals}
          title="Register company"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={closeModals}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={!form.name.trim() || saving}>
                {saving ? 'Saving…' : 'Register company'}
              </Button>
            </>
          }
        >
          {renderCompanyForm(false)}
        </Modal>

        <Modal
          isOpen={!!editCompany}
          onClose={closeModals}
          title="Edit company"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={closeModals}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleUpdate} disabled={!form.name.trim() || saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </>
          }
        >
          {renderCompanyForm(true)}
        </Modal>
      </div>
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) void deleteCompany(deleteId);
        }}
        title="Delete company?"
        message="This will permanently delete the company, all its employees, forms, submissions, workflows, and related data. This action is irreversible."
        confirmText="Delete company"
      />
    </AdminLayout>
  );
}
