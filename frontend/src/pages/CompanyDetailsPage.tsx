import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import AdminLayout from '../components/layout/AdminLayout';
import { Button, Input, Select, Label } from '../components/ui/Base';
import { Table, THead, TBody, TR, TH, TD, Modal, ConfirmModal } from '../components/ui/Complex';
import { PageHeader, KPICard, Card, RoleBadge } from '../components/admin';
import { Users, Plus, Mail, IdCard, Briefcase, Trash2, ArrowLeft, AlertCircle } from 'lucide-react';

export default function CompanyDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { companies, users, addUser, deleteUser, fetchCompanies, fetchUsers, isLoading } = useStore();
  
  React.useEffect(() => {
    fetchCompanies();
    fetchUsers();
  }, [fetchCompanies, fetchUsers]);

  const company = companies.find(c => c.id === id);
  const companyEmployees = users.filter(u => u.companyId === id);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newEmployee, setNewEmployee] = React.useState({
    name: '',
    email: '',
    employeeId: '',
    jobTitle: '',
    password: 'password123',
    role: 'user' as const
  });
  const [deleteUserId, setDeleteUserId] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isAdding, setIsAdding] = React.useState(false);

  if (!company) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <p className="text-ns-text-muted">Entity not found.</p>
          <Button variant="secondary" onClick={() => navigate('/companies')} className="mt-4">Return to Directory</Button>
        </div>
      </AdminLayout>
    );
  }

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name || !newEmployee.email) return;

    if (!validateEmail(newEmployee.email)) {
      setErrorMsg("Invalid corporate email format.");
      return;
    }

    setErrorMsg(null);
    setIsAdding(true);

    try {
      await addUser({
        name: newEmployee.name,
        email: newEmployee.email,
        empId: newEmployee.employeeId,
        jobTitle: newEmployee.jobTitle,
        password: newEmployee.password,
        role: newEmployee.role,
        companyId: company.id
      });

      setNewEmployee({ name: '', email: '', employeeId: '', jobTitle: '', password: 'password123', role: 'user' });
      setErrorMsg(null);
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to onboard employee.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <button
          onClick={() => navigate('/companies')}
          className="flex items-center gap-2 text-xs font-medium text-ns-text-muted hover:text-ns-blue transition-colors w-fit"
        >
          <ArrowLeft size={14} /> Back to companies
        </button>

        <PageHeader
          eyebrow="Company management"
          title={company.name}
          subtitle="Personnel ledger and access management"
          actions={
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus size={18} />
              Add employee
            </Button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KPICard label="Total employees" value={companyEmployees.length} subtext="Active roster" subtextVariant="info" />
          <KPICard label="Established" value={company.createdAt?.split('T')[0] || '—'} subtext="Registration date" subtextVariant="neutral" />
          <KPICard label="Entity ID" value={company.id.substring(0, 8)} subtext="Internal reference" subtextVariant="neutral" />
        </div>

        <Table>
            <THead>
              <TR>
                <TH>Name / Employee ID</TH>
                <TH>Email Address</TH>
                <TH>Functional Role</TH>
                <TH>Access Level</TH>
                <TH className="text-right px-6">Administrative Controls</TH>
              </TR>
            </THead>
            <TBody>
              {companyEmployees.map(emp => (
                <TR key={emp.id} className="group">
                  <TD className="py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-ns-text">{emp.name}</span>
                      <span className="text-[10px] text-ns-text-muted font-mono tracking-tighter uppercase">ID: {emp.employeeId || 'N/A'}</span>
                    </div>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2 text-xs font-semibold text-ns-text-muted underline">
                      <Mail size={12} />
                      {emp.email}
                    </div>
                  </TD>
                  <TD>
                    <span className="text-[10px] bg-ns-gray-bg border border-ns-border px-2 py-1 rounded-ns-md font-bold text-ns-navy grayscale">
                      {emp.jobTitle || 'Unassigned'}
                    </span>
                  </TD>
                  <TD>
                    <RoleBadge role={emp.role} />
                  </TD>
                  <TD className="px-6 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setDeleteUserId(emp.id)}
                      className="h-8 w-8 text-ns-text-muted hover:text-red-500 hover:bg-status-rejected-bg transition-all rounded-full"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </TD>
                </TR>
              ))}
              {companyEmployees.length === 0 && (
                <TR>
                  <TD colSpan={4} className="py-20 text-center bg-white italic text-ns-text-muted text-sm tracking-wide">
                    Zero synchronized personnel records found.
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Personnel Onboarding"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => { setIsModalOpen(false); setErrorMsg(null); }}>Cancel</Button>
              <Button size="sm" onClick={handleAddEmployee} disabled={!newEmployee.name || !newEmployee.email || isAdding}>
                {isAdding ? 'Synchronizing...' : 'Synchronize User Identity'}
              </Button>
            </>
          }
        >
          <form className="space-y-5" onSubmit={handleAddEmployee}>
            {errorMsg ? (
              <div className="p-3 bg-status-rejected-bg border border-red-200 text-[11px] text-status-rejected rounded-ns-md font-bold flex items-center gap-2">
                <AlertCircle size={14} />
                {errorMsg}
              </div>
            ) : (
              <div className="p-3 bg-status-pending-bg border border-amber-200 text-[11px] text-amber-800 rounded-ns-md italic">
                Generating new user identity automatically activates Corporate Dashboard access for this entity.
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label mandatory>Full Legal Name</Label>
                <Input 
                  placeholder="e.g. Rahul Sharma" 
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label mandatory>Corporate Email</Label>
                <Input 
                  type="email"
                  placeholder="name@company.com" 
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employee Serial ID</Label>
                <Input 
                  placeholder="e.g. EMP-2024-001" 
                  value={newEmployee.employeeId}
                  onChange={(e) => setNewEmployee({...newEmployee, employeeId: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Functional Job Title</Label>
                <Input 
                  placeholder="e.g. Senior Buyer" 
                  value={newEmployee.jobTitle}
                  onChange={(e) => setNewEmployee({...newEmployee, jobTitle: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label mandatory>Administrative Role</Label>
              <Select 
                value={newEmployee.role}
                onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value as any})}
              >
                <option value="user">Standard User</option>
                <option value="manager">Company Manager</option>
                <option value="client_admin">Client Administrator</option>
              </Select>
              <p className="text-[10px] text-ns-text-muted italic">
                {newEmployee.role === 'client_admin' && "Client Admins have full control over this entity's workflows and forms."}
                {newEmployee.role === 'manager' && "Managers can approve transactions within their designated hierarchy."}
                {newEmployee.role === 'user' && "Standard users can submit forms and track their own transactions."}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>System Password (Mock)</Label>
              <Input 
                value={newEmployee.password}
                onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
              />
              <p className="text-[10px] text-ns-text-muted italic">Used for simulated user authentication.</p>
            </div>
          </form>
        </Modal>
      </div>
      <ConfirmModal
        isOpen={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        onConfirm={() => { if(deleteUserId) deleteUser(deleteUserId); }}
        title="Revoke User Access?"
        message="This will permanently delete this user account. The employee will lose all access to their corporate dashboard."
      />
    </AdminLayout>
  );
}
