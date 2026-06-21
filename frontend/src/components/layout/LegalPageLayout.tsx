import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BrandLogo, BRAND_NAME } from '../brand/BrandLogo';
import { AUTH_ROUTES } from '../../config/authRoutes';
import { AUTH_PRIMARY } from '../../config/authTheme';

interface LegalPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80 overflow-hidden">
          <div className="px-8 pt-8 pb-5 border-b border-slate-100">
            <BrandLogo variant="auth" className="mb-6 max-h-14" />
            <Link
              to={AUTH_ROUTES.login}
              className="inline-flex items-center gap-1.5 text-sm font-medium mb-4 transition-colors auth-back-link"
              style={{ color: AUTH_PRIMARY }}
            >
              <ArrowLeft size={14} />
              Back to sign in
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          </div>

          <div className="px-8 py-6 text-sm text-slate-600 leading-relaxed space-y-4">{children}</div>

          <div className="px-8 py-4 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>&copy; {new Date().getFullYear()} {BRAND_NAME}</span>
            <Link to={AUTH_ROUTES.terms} className="text-slate-600 auth-footer-link transition-colors">
              Terms of Use
            </Link>
            <Link to={AUTH_ROUTES.privacy} className="text-slate-600 auth-footer-link transition-colors">
              Privacy Policy
            </Link>
            <Link to={AUTH_ROUTES.status} className="text-slate-600 auth-footer-link transition-colors">
              System Status
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
