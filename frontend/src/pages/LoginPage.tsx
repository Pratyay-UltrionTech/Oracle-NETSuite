import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  AuthLayout,
  AuthFieldLabel,
  AuthInput,
  AuthButton,
  AuthLink,
  AuthBackLink,
  AuthLockButton,
} from '../components/layout/AuthLayout';
import { ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { AUTH_PRIMARY } from '../config/authTheme';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, isLoading, error: storeError, forgotPassword } = useStore();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(false);
  const [isForgotMode, setIsForgotMode] = React.useState(false);
  const [forgotEmail, setForgotEmail] = React.useState('');
  const [forgotStatus, setForgotStatus] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [errorSpace, setErrorSpace] = React.useState('');

  React.useEffect(() => {
    if (user) {
      if (user.role === 'super_admin' || user.role === 'client_admin') {
        navigate('/dashboard');
      } else {
        navigate('/customer-dashboard');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorSpace('');
    const success = await login(email, password);
    if (!success) {
      setErrorSpace('Authentication failed. Please check your credentials.');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatus(null);
    const success = await forgotPassword(forgotEmail);
    if (success) {
      setForgotStatus({ type: 'success', message: 'If an account exists, a reset link has been sent.' });
    } else {
      setForgotStatus({ type: 'error', message: 'Failed to process request. Please try again.' });
    }
  };

  const currentError = storeError || errorSpace;

  return (
    <AuthLayout title={isForgotMode ? 'Forgot Password' : 'Log In'}>
      {!isForgotMode ? (
        <form onSubmit={handleSubmit} className="auth-form-shell">
          <div className="auth-form-fields">
            {currentError && (
              <div className="p-3.5 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{currentError}</span>
              </div>
            )}

            <div>
              <AuthFieldLabel htmlFor="email">Email address</AuthFieldLabel>
              <AuthInput
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <AuthFieldLabel htmlFor="password">Password</AuthFieldLabel>
              <AuthInput
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-2.5 pt-0.5">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 cursor-pointer"
                style={{ accentColor: AUTH_PRIMARY }}
              />
              <label htmlFor="remember" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                Remember me
              </label>
            </div>
          </div>

          <div className="auth-form-footer">
            <AuthButton type="submit" loading={isLoading}>
              <AuthLockButton label="Log In" />
            </AuthButton>
            <div className="text-center pt-6">
              <AuthLink onClick={() => setIsForgotMode(true)}>Forgot password?</AuthLink>
            </div>
          </div>
        </form>
      ) : (
        <form onSubmit={handleForgotSubmit} className="auth-form-shell">
          <div className="auth-form-fields auth-forgot-fields">
            <AuthBackLink
              onClick={() => { setIsForgotMode(false); setForgotStatus(null); }}
              className="self-start"
            >
              <ArrowLeft size={14} />
              Back to sign in
            </AuthBackLink>

            <p className="text-sm text-slate-500 leading-relaxed">
              Enter your email address and we will send you a link to reset your password.
            </p>

            {forgotStatus && (
              <div
                className={`p-3.5 rounded-xl flex items-start gap-2 text-sm border ${
                  forgotStatus.type === 'success'
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                    : 'bg-red-50 border-red-100 text-red-700'
                }`}
              >
                {forgotStatus.type === 'success' ? (
                  <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                )}
                <span>{forgotStatus.message}</span>
              </div>
            )}

            <div>
              <AuthFieldLabel htmlFor="forgot-email">Email address</AuthFieldLabel>
              <AuthInput
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-form-footer">
            <AuthButton type="submit" loading={isLoading}>
              <Send size={14} />
              Send reset link
            </AuthButton>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
