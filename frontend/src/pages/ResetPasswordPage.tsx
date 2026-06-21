import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  AuthLayout,
  AuthFieldLabel,
  AuthInput,
  AuthButton,
  AuthLink,
  AuthLockButton,
} from '../components/layout/AuthLayout';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword, isLoading, error: storeError } = useStore();

  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [status, setStatus] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!token) {
      setStatus({ type: 'error', message: 'Reset link is missing or invalid.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    if (newPassword.length < 8) {
      setStatus({ type: 'error', message: 'Password must be at least 8 characters long.' });
      return;
    }

    const success = await resetPassword(token, newPassword);
    if (success) {
      setStatus({ type: 'success', message: 'Password updated successfully. Redirecting to sign in…' });
      setTimeout(() => navigate('/'), 3000);
    } else {
      setStatus({ type: 'error', message: storeError || 'Failed to update password. Link may be expired.' });
    }
  };

  return (
    <AuthLayout title="Reset Password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-[13px] text-[#555] leading-relaxed">
          Choose a new password for your account.
        </p>

        {status && (
          <div
            className={`p-3 rounded-[3px] flex items-start gap-2 text-[13px] border ${
              status.type === 'success'
                ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]'
                : 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
            )}
            <span>{status.message}</span>
          </div>
        )}

        <div>
          <AuthFieldLabel htmlFor="new-password">New password</AuthFieldLabel>
          <AuthInput
            id="new-password"
            type="password"
            required
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />
        </div>

        <div>
          <AuthFieldLabel htmlFor="confirm-password">Confirm password</AuthFieldLabel>
          <AuthInput
            id="confirm-password"
            type="password"
            required
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
        </div>

        <div className="pt-2">
          <AuthButton type="submit" loading={isLoading}>
            <AuthLockButton label="Update Password" />
          </AuthButton>
        </div>

        <div className="text-center pt-1">
          <AuthLink onClick={() => navigate('/')}>Back to sign in</AuthLink>
        </div>
      </form>
    </AuthLayout>
  );
}
