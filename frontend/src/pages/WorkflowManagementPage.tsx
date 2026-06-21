import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import AdminLayout from '../components/layout/AdminLayout';
import { Button, Input, Label } from '../components/ui/Base';
import { workflowApi, WorkflowLevel, WorkflowResponse } from '../api/workflow';
import {
  GitBranch,
  Plus,
  Trash2,
  Users,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  AlertCircle,
  GripVertical,
  FileText,
} from 'lucide-react';
import { PageHeader, Card, StatusBadge } from '../components/admin';
import { cn } from '../lib/utils';

const EMPTY_LEVELS: WorkflowLevel[] = [{ level: 1, approvers: [] }];

function formLabel(formId: string, forms: { id: string; name: string; transactionType?: string }[]) {
  const form = forms.find(f => f.id === formId);
  return form ? `${form.name} (${form.transactionType?.replace(/_/g, ' ') || 'form'})` : formId;
}

export default function WorkflowManagementPage() {
  const { companyId: paramCompanyId } = useParams();
  const navigate = useNavigate();
  const { user, companies, users, forms, fetchCompanies, fetchUsers, fetchForms } = useStore();

  const companyId = paramCompanyId || user?.companyId;
  const isSuperAdmin = user?.role === 'super_admin';

  const [workflows, setWorkflows] = React.useState<WorkflowResponse[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = React.useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = React.useState(false);

  const [workflowName, setWorkflowName] = React.useState('');
  const [selectedFormIds, setSelectedFormIds] = React.useState<string[]>([]);
  const [levels, setLevels] = React.useState<WorkflowLevel[]>(EMPTY_LEVELS);

  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [notification, setNotification] = React.useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const company = companies.find(c => c.id === companyId);
  const companyEmployees = users.filter(u => u.companyId === companyId);
  const companyForms = forms.filter(f => f.customerId === companyId);

  const activeEditorId = isCreatingNew ? null : selectedWorkflowId;

  const resetEditor = () => {
    setWorkflowName('');
    setSelectedFormIds([]);
    setLevels([{ level: 1, approvers: [] }]);
  };

  const loadWorkflowIntoEditor = (workflow: WorkflowResponse) => {
    setIsCreatingNew(false);
    setSelectedWorkflowId(workflow.id);
    setWorkflowName(workflow.name);
    setSelectedFormIds(workflow.formIds || []);
    setLevels(workflow.levels.length > 0 ? workflow.levels : EMPTY_LEVELS);
  };

  const loadWorkflows = React.useCallback(async () => {
    if (!companyId) return [];
    const list = await workflowApi.listWorkflowsByCompany(companyId);
    setWorkflows(list);
    return list;
  }, [companyId]);

  React.useEffect(() => {
    const loadData = async () => {
      if (!companyId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        await Promise.all([fetchCompanies(), fetchUsers(), fetchForms(companyId)]);
        const list = await loadWorkflows();

        if (list.length > 0) {
          loadWorkflowIntoEditor(list[0]);
        } else {
          setIsCreatingNew(true);
          setSelectedWorkflowId(null);
          resetEditor();
          showNotification('Create a workflow and assign it to one or more forms.', 'info');
        }
      } catch {
        showNotification('Failed to load workflow data', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [companyId, fetchCompanies, fetchUsers, fetchForms, loadWorkflows]);

  const formAssignedElsewhere = (formId: string) => {
    if (activeEditorId) {
      return workflows.find(w => w.id !== activeEditorId && w.formIds?.includes(formId));
    }
    return workflows.find(w => w.formIds?.includes(formId));
  };

  const toggleFormSelection = (formId: string) => {
    if (formAssignedElsewhere(formId)) return;
    setSelectedFormIds(prev =>
      prev.includes(formId) ? prev.filter(id => id !== formId) : [...prev, formId],
    );
  };

  const handleNewWorkflow = () => {
    setIsCreatingNew(true);
    setSelectedWorkflowId(null);
    resetEditor();
    setWorkflowName('New approval workflow');
  };

  const handleSelectWorkflow = (workflow: WorkflowResponse) => {
    loadWorkflowIntoEditor(workflow);
  };

  const handleDeleteWorkflow = async () => {
    if (!selectedWorkflowId || isCreatingNew) return;
    if (!window.confirm('Delete this workflow? Forms using it will no longer require approval.')) return;

    try {
      await workflowApi.deleteWorkflow(selectedWorkflowId);
      showNotification('Workflow deleted', 'success');
      const list = await loadWorkflows();
      if (list.length > 0) {
        loadWorkflowIntoEditor(list[0]);
      } else {
        handleNewWorkflow();
      }
    } catch (error: any) {
      showNotification(error.response?.data?.detail || 'Failed to delete workflow', 'error');
    }
  };

  const handleAddLevel = () => {
    setLevels([...levels, { level: levels.length + 1, approvers: [] }]);
  };

  const handleRemoveLevel = (index: number) => {
    if (levels.length === 1) {
      showNotification('Workflow must have at least one level', 'error');
      return;
    }
    const newLevels = levels
      .filter((_, i) => i !== index)
      .map((level, i) => ({ ...level, level: i + 1 }));
    setLevels(newLevels);
  };

  const handleAddApprover = (levelIndex: number, userId: string) => {
    const employee = companyEmployees.find(u => u.id === userId);
    if (!employee) return;
    if (levels[levelIndex].approvers.some(a => a.userId === userId)) {
      showNotification('User already assigned to this level', 'error');
      return;
    }
    const newLevels = [...levels];
    newLevels[levelIndex].approvers.push({
      userId: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.jobTitle || 'Employee',
    });
    setLevels(newLevels);
  };

  const handleRemoveApprover = (levelIndex: number, userId: string) => {
    const newLevels = [...levels];
    newLevels[levelIndex].approvers = newLevels[levelIndex].approvers.filter(a => a.userId !== userId);
    setLevels(newLevels);
  };

  const handleSaveWorkflow = async () => {
    if (!workflowName.trim()) {
      showNotification('Please enter a workflow name', 'error');
      return;
    }
    if (selectedFormIds.length === 0) {
      showNotification('Select at least one form for this workflow', 'error');
      return;
    }
    if (levels.some(l => l.approvers.length === 0)) {
      showNotification('Each level must have at least one approver', 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (isCreatingNew || !selectedWorkflowId) {
        const result = await workflowApi.createWorkflow({
          companyId: companyId!,
          name: workflowName.trim(),
          formIds: selectedFormIds,
          levels,
        });
        showNotification('Workflow created successfully', 'success');
        const list = await loadWorkflows();
        const created = list.find(w => w.id === result.id);
        if (created) loadWorkflowIntoEditor(created);
      } else {
        await workflowApi.updateWorkflow(selectedWorkflowId, {
          name: workflowName.trim(),
          formIds: selectedFormIds,
          levels,
        });
        showNotification('Workflow updated successfully', 'success');
        await loadWorkflows();
      }
    } catch (error: any) {
      showNotification(error.response?.data?.detail || 'Failed to save workflow', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const moveLevel = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === levels.length - 1) return;
    const newLevels = [...levels];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newLevels[index], newLevels[swapIndex]] = [newLevels[swapIndex], newLevels[index]];
    setLevels(newLevels.map((l, i) => ({ ...l, level: i + 1 })));
  };

  if (!company && !isLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-status-rejected-bg rounded-full flex items-center justify-center text-red-500">
            <AlertCircle size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ns-navy">Company not found</h2>
            <p className="text-ns-text-muted mt-1 max-w-xs mx-auto">We could not find the company for this workflow.</p>
          </div>
          <Button variant="secondary" onClick={() => navigate(isSuperAdmin ? '/companies' : '/dashboard')}>
            Return to {isSuperAdmin ? 'companies' : 'dashboard'}
          </Button>
        </div>
      </AdminLayout>
    );
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ns-blue" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 pb-20">
        <div className="flex flex-col gap-4">
          {isSuperAdmin && (
            <button
              onClick={() => navigate('/companies')}
              className="flex items-center gap-2 text-xs font-medium text-ns-text-muted hover:text-ns-blue transition-colors w-fit"
            >
              <ArrowLeft size={14} /> Back to companies
            </button>
          )}

          <PageHeader
            eyebrow="Workflow configuration"
            title="Approval routing"
            subtitle={`Create workflows and assign each one to specific forms for ${company?.name}.`}
            actions={
              <div className="flex gap-2">
                {!isCreatingNew && selectedWorkflowId && (
                  <Button variant="secondary" onClick={() => void handleDeleteWorkflow()} className="gap-2 text-status-rejected">
                    <Trash2 size={16} />
                    Delete
                  </Button>
                )}
                <Button onClick={handleSaveWorkflow} disabled={isSaving} className="gap-2">
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                  {isSaving ? 'Saving…' : isCreatingNew ? 'Create workflow' : 'Save workflow'}
                </Button>
              </div>
            }
          />
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <Card className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-ns-text">Workflows</h2>
                <Button variant="secondary" size="sm" onClick={handleNewWorkflow} className="h-8 px-2 gap-1">
                  <Plus size={14} />
                  New
                </Button>
              </div>

              {workflows.length === 0 && !isCreatingNew ? (
                <p className="text-xs text-ns-text-muted italic">No workflows yet.</p>
              ) : (
                <div className="space-y-2">
                  {workflows.map(wf => (
                    <button
                      key={wf.id}
                      type="button"
                      onClick={() => handleSelectWorkflow(wf)}
                      className={cn(
                        'w-full text-left rounded-ns-md border px-3 py-2.5 transition-all',
                        !isCreatingNew && selectedWorkflowId === wf.id
                          ? 'border-ns-blue bg-ns-blue-soft'
                          : 'border-ns-border hover:border-ns-blue/40 hover:bg-ns-page-bg',
                      )}
                    >
                      <p className="text-xs font-semibold text-ns-text truncate">{wf.name}</p>
                      <p className="text-[10px] text-ns-text-muted mt-1">
                        {wf.formIds?.length
                          ? `${wf.formIds.length} form${wf.formIds.length === 1 ? '' : 's'}`
                          : 'Legacy — all forms'}
                      </p>
                    </button>
                  ))}
                  {isCreatingNew && (
                    <div className="rounded-ns-md border border-dashed border-ns-blue bg-ns-blue-soft/40 px-3 py-2.5">
                      <p className="text-xs font-semibold text-ns-blue">New workflow (draft)</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-6 space-y-6">
            <Card className="space-y-4">
              <div className="flex items-center gap-2 border-b border-ns-border pb-3">
                <StatusBadge variant="synced">Step 1</StatusBadge>
                <h2 className="text-sm font-semibold text-ns-text">Workflow details</h2>
              </div>
              <div>
                <Label mandatory>Workflow name</Label>
                <Input
                  placeholder="e.g. Purchase Order Approval"
                  value={workflowName}
                  onChange={e => setWorkflowName(e.target.value)}
                  className="h-10 text-lg font-semibold"
                />
              </div>
            </Card>

            <Card className="space-y-4">
              <div className="flex items-center gap-2 border-b border-ns-border pb-3">
                <StatusBadge variant="pending">Step 2</StatusBadge>
                <h2 className="text-sm font-semibold text-ns-text">Assign to forms</h2>
              </div>
              <p className="text-xs text-ns-text-muted leading-relaxed">
                Each form can only belong to one workflow. Unassigned forms submit directly to NetSuite without approval.
              </p>
              {companyForms.length === 0 ? (
                <div className="flex items-center gap-2 p-3 bg-ns-gray-bg border border-ns-border rounded-ns-md text-ns-text-muted text-xs">
                  <FileText size={14} />
                  No forms found for this company.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {companyForms.map(form => {
                    const conflict = formAssignedElsewhere(form.id);
                    const checked = selectedFormIds.includes(form.id);
                    return (
                      <label
                        key={form.id}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-ns-md border cursor-pointer transition-all',
                          conflict
                            ? 'border-ns-border bg-ns-gray-bg opacity-60 cursor-not-allowed'
                            : checked
                              ? 'border-ns-blue bg-ns-blue-soft/50'
                              : 'border-ns-border hover:border-ns-blue/30',
                        )}
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={checked}
                          disabled={Boolean(conflict)}
                          onChange={() => toggleFormSelection(form.id)}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ns-text">{form.name}</p>
                          <p className="text-[10px] text-ns-text-muted capitalize">
                            {form.transactionType?.replace(/_/g, ' ') || 'Form'}
                          </p>
                          {conflict && (
                            <p className="text-[10px] text-status-rejected mt-1">
                              Assigned to &quot;{conflict.name}&quot;
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </Card>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <StatusBadge variant="approved">Step 3</StatusBadge>
                  <h2 className="text-sm font-semibold text-ns-text">Approval steps</h2>
                </div>
                <Button variant="secondary" size="sm" onClick={handleAddLevel} className="h-8 px-4 gap-1.5 text-[10px] font-bold uppercase">
                  <Plus size={14} /> Add level
                </Button>
              </div>

              <div className="space-y-4">
                {levels.map((level, idx) => (
                  <Card key={idx} padding="none" className="overflow-hidden">
                    <div className="bg-ns-page-bg border-b border-ns-border px-4 py-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <GripVertical size={16} className="text-ns-text-muted" />
                        <span className="text-xs font-semibold text-ns-blue">Level {level.level}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveLevel(idx, 'up')} disabled={idx === 0}>
                          <ChevronUp size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveLevel(idx, 'down')} disabled={idx === levels.length - 1}>
                          <ChevronDown size={14} />
                        </Button>
                        <Button variant="iconDanger" size="icon" className="h-7 w-7" onClick={() => handleRemoveLevel(idx)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                    <div className="p-5">
                      <Label>Assign approvers for this level</Label>
                      <select
                        className="w-full h-9 mt-1.5 rounded-ns-md border border-ns-border bg-white px-3 text-xs focus:ring-1 focus:ring-ns-blue outline-none"
                        onChange={e => {
                          if (e.target.value) {
                            handleAddApprover(idx, e.target.value);
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="">Search and select employees…</option>
                        {companyEmployees
                          .filter(emp => !level.approvers.some(a => a.userId === emp.id))
                          .map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} ({emp.jobTitle || 'Employee'})
                            </option>
                          ))}
                      </select>
                      <div className="mt-4 space-y-2">
                        {level.approvers.length === 0 ? (
                          <div className="flex items-center gap-2 p-3 bg-status-rejected-bg border border-red-100 rounded-ns-md text-status-rejected text-[11px]">
                            <AlertCircle size={14} />
                            Add at least one approver for this step.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {level.approvers.map(approver => (
                              <div key={approver.userId} className="flex items-center justify-between p-2 bg-ns-gray-bg border border-ns-border rounded-ns-md">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-full bg-ns-navy/10 text-ns-navy flex items-center justify-center text-[10px] font-black uppercase shrink-0">
                                    {approver.name.substring(0, 2)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-ns-text truncate">{approver.name}</p>
                                    <p className="text-[9px] text-ns-text-muted truncate">{approver.role}</p>
                                  </div>
                                </div>
                                <button type="button" onClick={() => handleRemoveApprover(idx, approver.userId)} className="p-1 ns-action-danger rounded-ns-md shrink-0">
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-3 space-y-6">
            <Card className="bg-ns-navy text-white border-ns-navy space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-[10px] text-white/60">Forms</span>
                  <span className="font-bold">{selectedFormIds.length}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-[10px] text-white/60">Levels</span>
                  <span className="font-bold">{levels.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-white/60">Approvers</span>
                  <span className="font-bold">{levels.reduce((acc, l) => acc + l.approvers.length, 0)}</span>
                </div>
              </div>
              {selectedFormIds.length > 0 && (
                <div className="pt-2 border-t border-white/10 space-y-1">
                  <p className="text-[10px] text-white/50 uppercase tracking-widest">Assigned forms</p>
                  {selectedFormIds.map(id => (
                    <p key={id} className="text-[10px] text-white/80 truncate">
                      {formLabel(id, companyForms)}
                    </p>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ns-navy mb-3">Quick reference</h3>
              <ul className="space-y-2 text-[10px] text-ns-text-muted leading-relaxed">
                <li>One workflow can cover multiple forms.</li>
                <li>Each form can only use one workflow.</li>
                <li>Forms without a workflow sync directly to NetSuite.</li>
                <li>Pending submissions keep the workflow they started with.</li>
              </ul>
            </Card>
          </div>
        </div>

        {notification && (
          <div
            className={cn(
              'fixed top-20 right-6 z-[100] text-white px-6 py-3 rounded-ns-md shadow-2xl border-l-4 animate-in fade-in slide-in-from-right-4 duration-300 flex items-center gap-3',
              notification.type === 'success' ? 'bg-ns-navy border-ns-blue' : notification.type === 'error' ? 'bg-red-600 border-red-400' : 'bg-ns-navy border-amber-400',
            )}
          >
            <span className="text-xs font-bold uppercase tracking-widest">{notification.message}</span>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
