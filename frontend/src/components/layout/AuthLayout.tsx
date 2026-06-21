import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock } from 'lucide-react';
import { BRAND_NAME } from '../brand/BrandLogo';
import { AuthPromoPanel } from './AuthPromoPanel';
import { AUTH_ROUTES } from '../../config/authRoutes';
import { AUTH_PRIMARY } from '../../config/authTheme';

interface AuthLayoutProps {
  title: string;
  children: React.ReactNode;
  hidePromo?: boolean;
}

export function AuthLayout({
  title,
  children,
  hidePromo = false,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F7F7F7]">
      {!hidePromo && <AuthPromoPanel />}

      <div className="flex flex-1 flex-col min-h-screen lg:min-h-0 bg-[#F7F7F7]">
        <div className="auth-split-column flex-1 min-h-0">
          {!hidePromo && (
            <header className="auth-brand-header hidden lg:flex" aria-hidden="true">
              <div className="auth-brand-header-spacer" />
            </header>
          )}

          <div className="auth-card-slot auth-form-card-slot">
            <div className="auth-form-card auth-form-panel-card">
              <div className="shrink-0 text-center">
                <h1 className="text-[1.85rem] xl:text-[2.25rem] font-bold text-slate-900 tracking-tight leading-[1.18]">
                  {title}
                </h1>
                <p className="mt-2.5 text-[15px] xl:text-base text-slate-600 leading-relaxed">
                  {title === 'Forgot Password'
                    ? 'We’ll email you a link to reset your password.'
                    : 'Sign in to your workspace to continue.'}
                </p>
              </div>

              <div className="auth-form-divider my-7 xl:my-8" aria-hidden="true" />

              <div className="auth-form-card-body">{children}</div>
            </div>
          </div>
        </div>

        <footer className="shrink-0 px-6 sm:px-10 py-5 border-t border-slate-200/90 bg-[#F7F7F7] flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[13px] text-slate-600 text-center">
          <span>&copy; {new Date().getFullYear()} {BRAND_NAME}</span>
          <Link to={AUTH_ROUTES.terms} className="text-slate-600 auth-footer-link transition-colors hover:underline">
            Terms of Use
          </Link>
          <Link to={AUTH_ROUTES.privacy} className="text-slate-600 auth-footer-link transition-colors hover:underline">
            Privacy Policy
          </Link>
          <Link to={AUTH_ROUTES.status} className="text-slate-600 auth-footer-link transition-colors hover:underline">
            System Status
          </Link>
        </footer>
      </div>
    </div>
  );
}

export function AuthFieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-800 mb-1.5">
      {children}
    </label>
  );
}

export function AuthInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 text-[15px] text-slate-900 placeholder:text-slate-400 shadow-sm transition-all focus:outline-none focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 auth-input ${className ?? ''}`}
      {...props}
    />
  );
}

export function AuthButton({ children, className, loading, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl text-white text-[15px] font-semibold transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none auth-button ${className ?? ''}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}

export function AuthBackLink({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 text-sm font-normal cursor-pointer underline underline-offset-[3px] decoration-slate-400/70 transition-colors focus:outline-none auth-link hover:decoration-current ${className ?? ''}`}
      style={{ color: AUTH_PRIMARY }}
      {...props}
    >
      {children}
    </button>
  );
}

export function AuthLink({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`text-sm font-normal cursor-pointer underline underline-offset-[3px] decoration-slate-400/70 transition-colors focus:outline-none auth-link hover:decoration-current ${className ?? ''}`}
      style={{ color: AUTH_PRIMARY }}
      {...props}
    >
      {children}
    </button>
  );
}

export function AuthLockButton({ label = 'Log In' }: { loading?: boolean; label?: string }) {
  return (
    <>
      <Lock size={15} strokeWidth={2.5} />
      {label}
      <ArrowRight size={15} className="ml-0.5 opacity-80" />
    </>
  );
}
