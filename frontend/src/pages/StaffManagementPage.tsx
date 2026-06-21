import * as React from 'react';
import { useStore } from '../store/useStore';
import AdminLayout from '../components/layout/AdminLayout';
import {
  Users,
  UserPlus,
  Search,
  Trash2,
  Lock,
  XCircle,
  AlertCircle,
  Upload,
  Edit2,
} from 'lucide-react';
import { User, UserRole } from '../types';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Base';
import { Table, THead, TBody, TR, TH, TD, ConfirmModal } from '../components/ui/Complex';
import {
  PageHeader,
  KPICard,
  RoleBadge,
  StatusBadge,
  Card,
  CardHeader,
  PermissionMatrix,
  StatusToggle,
} from '../components/admin';

export default function StaffManagementPage() {
  const { user: currentUser, users, fetchUsers, companies, fetchCompanies, addUser, deleteUser, updateUser, updateUserStatus } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [deleteUserId, setDeleteUserId] = React.useState<string | null>(null);
  const [togglingUserId, setTogglingUserId] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<string>('all');
  const [companyFilter, setCompanyFilter] = React.useState<string>('all');

  const [newUserName, setNewUserName] = React.useState('');
  const [newUserEmail, setNewUserEmail] = React.useState('');
  const [newUserPassword, setNewUserPassword] = React.useState('');
  const [newUserRole, setNewUserRole] = React.useState<UserRole>('user');
  const [newUserCompany, setNewUserCompany] = React.useState('');
  const [newUserEmpId, setNewUserEmpId] = React.useState('');
  const [newUserJobTitle, setNewUserJobTitle] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [editName, setEditName] = React.useState('');
  const [editEmail, setEditEmail] = React.useState('');
  const [editRole, setEditRole] = React.useState<UserRole>('user');
  const [editEmpId, setEditEmpId] = React.useState('');
  const [editJobTitle, setEditJobTitle] = React.useState('');
  const [editCompanyId, setEditCompanyId] = React.useState('');

  const isSuperAdmin = currentUser?.role === 'super_admin';

  React.useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, [fetchUsers, fetchCompanies]);

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesCompany = companyFilter === 'all' || u.companyId === companyFilter;

    if (currentUser?.role === 'client_admin') {
      return matchesSearch && matchesRole && u.companyId === currentUser.companyId;
    }

    return matchesSearch && matchesRole && matchesCompany;
  });

  const activeCount = filteredUsers.filter(u => u.isActive).length;
  const inactiveCount = filteredUsers.filter(u => !u.isActive).length;
  const vendorUsers = filteredUsers.filter(u => u.role === 'user').length;
  const pendingCount = filteredUsers.filter(u => !u.isActive).length;

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await addUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        empId: newUserEmpId,
        jobTitle: newUserJobTitle,
        companyId:
          currentUser?.role === 'client_admin'
            ? currentUser.companyId
            : newUserRole === 'super_admin'
              ? undefined
              : newUserCompany,
      });
      setIsAddModalOpen(false);
      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not create user.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole('user');
    setNewUserCompany('');
    setNewUserEmpId('');
    setNewUserJobTitle('');
    setErrorMsg(null);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditEmpId(user.employeeId || '');
    setEditJobTitle(user.jobTitle || '');
    setEditCompanyId(user.companyId || '');
    setErrorMsg(null);
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setErrorMsg(null);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await updateUser(editingUser.id, {
        name: editName,
        email: editEmail,
        role: editRole,
        employeeId: editEmpId || undefined,
        jobTitle: editJobTitle || undefined,
        ...(isSuperAdmin && editRole !== 'super_admin' && editCompanyId
          ? { companyId: editCompanyId }
          : {}),
      });
      closeEditModal();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not update user.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusToggle = async (userId: string, next: boolean) => {
    setTogglingUserId(userId);
    try {
      await updateUserStatus(userId, next);
    } catch {
      // surfaced via store
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    try {
      await deleteUser(deleteUserId);
      setDeleteUserId(null);
    } catch {
      // surfaced via store
    }
  };

  const renderStatusCell = (u: User) => (
    <div className="flex items-center gap-3">
      <StatusToggle
        checked={u.isActive}
        disabled={u.id === currentUser?.id || togglingUserId === u.id}
        onChange={next => void handleStatusToggle(u.id, next)}
        label={u.isActive ? `Deactivate ${u.name}` : `Activate ${u.name}`}
      />
      <StatusBadge variant={u.isActive ? 'approved' : 'inactive'}>
        {u.isActive ? 'Active' : 'Inactive'}
      </StatusBadge>
    </div>
  );

  const renderUserActions = (u: User) => {
    if (u.id === currentUser?.id) return <span className="text-xs text-ns-text-muted">You</span>;

    return (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="iconMuted"
          size="icon"
          className="h-8 w-8 rounded-full"
          title="Edit user"
          onClick={() => openEditModal(u)}
        >
          <Edit2 size={14} />
        </Button>
        <Button
          variant="iconDanger"
          size="icon"
          className="h-8 w-8 rounded-full"
          title="Delete user"
          onClick={() => setDeleteUserId(u.id)}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    );
  };

  const addUserModal = isAddModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ns-navy/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-ns-xl border border-ns-border shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-ns-border flex items-center justify-between">
          <h3 className="font-semibold text-ns-text flex items-center gap-2">
            <UserPlus size={18} className="text-ns-blue" />
            New user
          </h3>
          <button
            onClick={() => {
              setIsAddModalOpen(false);
              setErrorMsg(null);
            }}
            className="text-ns-text-muted hover:text-ns-text"
          >
            <XCircle size={20} />
          </button>
        </div>

        <form onSubmit={handleAddUser} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-status-rejected-bg border border-status-rejected/20 text-xs text-status-rejected rounded-ns-md font-medium flex items-center gap-2">
              <AlertCircle size={14} />
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-ns-text-muted mb-1">Full name</label>
              <input
                type="text"
                required
                value={newUserName}
                onChange={e => setNewUserName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-ns-border rounded-ns-md text-sm focus:outline-none focus:border-ns-blue focus:ring-2 focus:ring-ns-blue/15"
                placeholder="John Doe"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-ns-text-muted mb-1">Email address</label>
              <input
                type="email"
                required
                value={newUserEmail}
                onChange={e => setNewUserEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-ns-border rounded-ns-md text-sm focus:outline-none focus:border-ns-blue focus:ring-2 focus:ring-ns-blue/15"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ns-text-muted mb-1">Employee ID</label>
              <input
                type="text"
                value={newUserEmpId}
                onChange={e => setNewUserEmpId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-ns-border rounded-ns-md text-sm focus:outline-none focus:border-ns-blue"
                placeholder="EMP-123"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ns-text-muted mb-1">Job title</label>
              <input
                type="text"
                value={newUserJobTitle}
                onChange={e => setNewUserJobTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-ns-border rounded-ns-md text-sm focus:outline-none focus:border-ns-blue"
                placeholder="Manager"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-ns-text-muted mb-1">Initial password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-ns-text-muted" size={14} />
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-ns-border rounded-ns-md text-sm focus:outline-none focus:border-ns-blue"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {isSuperAdmin ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-ns-text-muted mb-1">Role</label>
                  <select
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-white border border-ns-border rounded-ns-md text-sm focus:outline-none focus:border-ns-blue"
                  >
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="client_admin">Client Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ns-text-muted mb-1">Company</label>
                  <select
                    disabled={newUserRole === 'super_admin'}
                    required={newUserRole !== 'super_admin'}
                    value={newUserCompany}
                    onChange={e => setNewUserCompany(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-ns-border rounded-ns-md text-sm focus:outline-none focus:border-ns-blue disabled:opacity-50"
                  >
                    <option value="">Select company…</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div className="md:col-span-2 p-3 bg-ns-blue-soft border border-ns-border rounded-ns-md">
                <p className="text-xs text-ns-text-muted">
                  Adding to <span className="font-semibold text-ns-text">{currentUser?.companyName}</span>
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-ns-border flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setErrorMsg(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create user'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  const editUserModal = editingUser && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ns-navy/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-ns-xl border border-ns-border shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-ns-border flex items-center justify-between">
          <h3 className="font-semibold text-ns-text flex items-center gap-2">
            <Edit2 size={18} className="text-ns-blue" />
            Edit user
          </h3>
          <button onClick={closeEditModal} className="text-ns-text-muted hover:text-ns-text">
            <XCircle size={20} />
          </button>
        </div>

        <form onSubmit={handleEditUser} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-status-rejected-bg border border-status-rejected/20 text-xs text-status-rejected rounded-ns-md font-medium flex items-center gap-2">
              <AlertCircle size={14} />
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-ns-text-muted mb-1">Full name</label>
              <input
                type="text"
                required
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-ns-border rounded-ns-md text-sm focus:outline-none focus:border-ns-blue focus:ring-2 focus:ring-ns-blue/15"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-ns-text-muted mb-1">Email address</label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-ns-border rounded-ns-md text-sm focus:outline-none focus:border-ns-blue focus:ring-2 focus:ring-ns-blue/15"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ns-text-muted mb-1">Employee ID</label>
              <input
                type="text"
                value={editEmpId}
                onChange={e => setEditEmpId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-ns-border rounded-ns-md text-sm focus:outline-none focus:border-ns-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ns-text-muted mb-1">Job title</label>
              <input
                type="text"
                value={editJobTitle}
                onChange={e => setEditJobTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-ns-border rounded-ns-md text-sm focus:outline-none focus:border-ns-blue"
              />
            </div>

            <div className={isSuperAdmin ? '' : 'md:col-span-2'}>
              <label className="block text-xs font-medium text-ns-text-muted mb-1">Role</label>
              <select
                value={editRole}
                onChange={e => setEditRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-white border border-ns-border rounded-ns-md text-sm focus:outline-none focus:border-ns-blue"
              >
                <option value="user">User</option>
                <option value="manager">Manager</option>
                <option value="client_admin">Client Admin</option>
                {isSuperAdmin && <option value="super_admin">Super Admin</option>}
              </select>
            </div>

            {isSuperAdmin && editRole !== 'super_admin' && (
              <div>
                <label className="block text-xs font-medium text-ns-text-muted mb-1">Company</label>
                <select
                  required
                  value={editCompanyId}
                  onChange={e => setEditCompanyId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-ns-border rounded-ns-md text-sm focus:outline-none focus:border-ns-blue"
                >
                  <option value="">Select company…</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-ns-border flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  const deleteConfirmModal = (
    <ConfirmModal
      isOpen={!!deleteUserId}
      onClose={() => setDeleteUserId(null)}
      onConfirm={() => void handleDeleteUser()}
      title="Delete user?"
      message="This will permanently remove the user account. They will lose access immediately."
      confirmText="Delete user"
    />
  );

  if (isSuperAdmin) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader
            eyebrow="Admin"
            title="User management"
            subtitle="Manage users, roles, and account status across all companies."
            actions={
              <>
                <Button variant="secondary" className="gap-2">
                  <Upload size={16} />
                  Bulk import (CSV)
                </Button>
                <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
                  <UserPlus size={16} />
                  New user
                </Button>
              </>
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KPICard
              label="Total users"
              value={filteredUsers.length}
              subtext={`${activeCount} active · ${inactiveCount} inactive`}
              subtextVariant="success"
            />
            <KPICard label="Standard users" value={vendorUsers} subtext="External users" subtextVariant="neutral" />
            <KPICard
              label="Pending approvals"
              value={pendingCount}
              subtext="Inactive accounts"
              subtextVariant="warning"
            />
            <KPICard
              label="Admin roles"
              value={filteredUsers.filter(u => u.role === 'super_admin' || u.role === 'client_admin').length}
              subtext="Admin + Client Admin"
              subtextVariant="info"
            />
          </div>

          <Card padding="none">
            <div className="p-5 border-b border-ns-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardHeader title="All users" className="mb-0" />
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[200px]">
                  <Search className="absolute left-3 top-2.5 text-ns-text-muted" size={14} />
                  <input
                    type="text"
                    placeholder="Search users…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-ns-border rounded-ns-md focus:outline-none focus:border-ns-blue focus:ring-2 focus:ring-ns-blue/15"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="px-3 py-2 text-sm bg-white border border-ns-border rounded-ns-md focus:outline-none focus:border-ns-blue"
                >
                  <option value="all">All roles</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="client_admin">Client Admin</option>
                  <option value="manager">Manager</option>
                  <option value="user">User</option>
                </select>
                <select
                  value={companyFilter}
                  onChange={e => setCompanyFilter(e.target.value)}
                  className="px-3 py-2 text-sm bg-white border border-ns-border rounded-ns-md focus:outline-none focus:border-ns-blue"
                >
                  <option value="all">All companies</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Table className="border-0 shadow-none rounded-none">
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Email</TH>
                  <TH>Role</TH>
                  <TH>Status</TH>
                  <TH>Company</TH>
                  <TH>Joined</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {filteredUsers.length === 0 ? (
                  <TR>
                    <TD colSpan={7} className="text-center py-12 text-ns-text-muted">
                      No users found matching current filters.
                    </TD>
                  </TR>
                ) : (
                  filteredUsers.map(u => (
                    <TR
                      key={u.id}
                      className={cn(!u.isActive && 'bg-status-pending-bg/30')}
                    >
                      <TD>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-ns-blue-soft text-ns-blue flex items-center justify-center text-xs font-semibold">
                            {u.name.substring(0, 1)}
                          </div>
                          <span className="font-medium text-ns-text">{u.name}</span>
                        </div>
                      </TD>
                      <TD className="text-ns-text-muted">{u.email}</TD>
                      <TD>
                        <RoleBadge role={u.role} />
                      </TD>
                      <TD>{renderStatusCell(u)}</TD>
                      <TD className="text-ns-text-muted text-sm">{u.companyName || 'Global'}</TD>
                      <TD className="text-ns-text-muted text-sm">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </TD>
                      <TD className="text-right">{renderUserActions(u)}</TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          </Card>

          <PermissionMatrix />
        </div>
        {addUserModal}
        {editUserModal}
        {deleteConfirmModal}
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Company admin"
          title="User management"
          subtitle="Manage users, roles, and account status for your organization."
          actions={
            <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
              <UserPlus size={16} />
              New user
            </Button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KPICard label="Total users" value={filteredUsers.length} subtext={`${activeCount} active`} subtextVariant="success" />
          <KPICard label="Inactive" value={inactiveCount} subtextVariant={inactiveCount > 0 ? 'warning' : 'neutral'} />
        </div>

        <Card padding="none">
          <div className="p-5 border-b border-ns-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardHeader title="Employees" className="mb-0" />
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px]">
                <Search className="absolute left-3 top-2.5 text-ns-text-muted" size={14} />
                <input
                  type="text"
                  placeholder="Search users…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-ns-border rounded-ns-md focus:outline-none focus:border-ns-blue focus:ring-1 focus:ring-ns-blue/20"
                />
              </div>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-white border border-ns-border rounded-ns-md focus:outline-none focus:border-ns-blue"
              >
                <option value="all">All roles</option>
                <option value="client_admin">Client Admin</option>
                <option value="manager">Manager</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>

          <Table className="border-0 shadow-none rounded-none">
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Role</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {filteredUsers.length === 0 ? (
                <TR>
                  <TD colSpan={4} className="text-center py-12 text-ns-text-muted">
                    No employees found matching current filters.
                  </TD>
                </TR>
              ) : (
                filteredUsers.map(u => (
                  <TR key={u.id} className={cn(!u.isActive && 'bg-status-pending-bg/20')}>
                    <TD>
                      <p className="text-sm font-semibold text-ns-text">{u.name}</p>
                      <p className="text-xs text-ns-text-muted">{u.email}</p>
                    </TD>
                    <TD>
                      <RoleBadge role={u.role} />
                    </TD>
                    <TD>{renderStatusCell(u)}</TD>
                    <TD className="text-right">{renderUserActions(u)}</TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </Card>
      </div>
      {addUserModal}
      {editUserModal}
      {deleteConfirmModal}
    </AdminLayout>
  );
}
