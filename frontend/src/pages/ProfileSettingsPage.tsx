import * as React from 'react';
import { useStore } from '../store/useStore';
import AdminLayout from '../components/layout/AdminLayout';
import CustomerLayout from '../components/layout/CustomerLayout';
import { PageHeader, Card } from '../components/admin';
import { cn } from '../lib/utils';
import { Lock, User, Mail, Building, Briefcase, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfileSettingsPage() {
  const { user, changePassword } = useStore();
  const [oldPassword, setOldPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [status, setStatus] = React.useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const Layout = (user?.role === 'super_admin' || user?.role === 'client_admin') ? AdminLayout : CustomerLayout;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);
    
    const success = await changePassword(oldPassword, newPassword);
    if (success) {
      setStatus({ type: 'success', message: 'Password changed successfully' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setStatus({ type: 'error', message: 'Failed to change password. Please check your old password.' });
    }
    setIsSubmitting(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Profile settings"
          subtitle="Manage your account information and security."
        />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-ns-blue/10 border-4 border-white shadow-md flex items-center justify-center text-ns-blue mb-4">
                <User size={48} />
              </div>
              <h2 className="text-lg font-bold text-ns-navy">{user?.name}</h2>
              <p className="text-xs font-bold text-ns-blue uppercase tracking-widest mt-1">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-ns-text-muted" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-[10px] font-bold text-ns-text-muted uppercase tracking-tight">Email Address</p>
                  <p className="text-sm font-semibold text-ns-navy truncate">{user?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Building size={16} className="text-ns-text-muted" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-[10px] font-bold text-ns-text-muted uppercase tracking-tight">Company</p>
                  <p className="text-sm font-semibold text-ns-navy truncate">{user?.companyName || 'Global Administrator'}</p>
                </div>
              </div>

              {user?.jobTitle && (
                <div className="flex items-center gap-3">
                  <Briefcase size={16} className="text-ns-text-muted" />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[10px] font-bold text-ns-text-muted uppercase tracking-tight">Job Title</p>
                    <p className="text-sm font-semibold text-ns-navy truncate">{user?.jobTitle}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card padding="none" className="overflow-hidden">
            <div className="px-6 py-4 border-b border-ns-border bg-ns-page-bg flex items-center gap-2">
              <Lock size={18} className="text-ns-blue" />
              <h3 className="font-semibold text-ns-text">Change password</h3>
            </div>
            
            <form onSubmit={handlePasswordChange} className="p-6 space-y-6">
              {status && (
                <div className={cn(
                  "p-4 rounded-ns-md flex items-start gap-3 animate-in fade-in slide-in-from-top-2",
                  status.type === 'success' ? "bg-status-approved-bg border border-green-200 text-green-800" : "bg-status-rejected-bg border border-red-200 text-red-800"
                )}>
                  {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <p className="text-sm font-medium">{status.message}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-ns-navy uppercase tracking-widest mb-2">Current Password</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-ns-gray-bg border border-ns-border rounded-ns-md focus:outline-none focus:border-ns-blue transition-all"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ns-navy uppercase tracking-widest mb-2">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-ns-gray-bg border border-ns-border rounded-ns-md focus:outline-none focus:border-ns-blue transition-all"
                    placeholder="Min. 6 characters"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ns-navy uppercase tracking-widest mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-ns-gray-bg border border-ns-border rounded-ns-md focus:outline-none focus:border-ns-blue transition-all"
                    placeholder="Repeat new password"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-ns-border flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-ns-blue hover:bg-ns-blue-dark text-white font-bold py-2.5 px-8 rounded-ns-md shadow-lg shadow-ns-blue/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>
      </div>
    </Layout>
  );
}
