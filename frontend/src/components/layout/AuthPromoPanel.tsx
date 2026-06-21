import { FileStack, Plug, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../brand/BrandLogo';
import { AUTH_ROUTES } from '../../config/authRoutes';
import { AUTH_PRIMARY, AUTH_PRIMARY_LIGHT } from '../../config/authTheme';

const FEATURES = [
  {
    icon: FileStack,
    title: 'Flexible Form Builder',
    text: 'Design and manage business forms, approvals, and workflows with ease.',
  },
  {
    icon: Plug,
    title: 'Enterprise Integration',
    text: 'Connect seamlessly with your business applications and data sources.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Governed',
    text: 'Role-based access, audit trails, and enterprise-grade security built in.',
  },
] as const;

export function AuthPromoPanel() {
  return (
    <aside className="auth-hero hidden lg:flex lg:w-[48%] xl:w-[52%] shrink-0 relative flex-col overflow-hidden text-white min-h-0">
      <div className="auth-hero-bg" aria-hidden="true" />
      <div className="auth-hero-mesh" aria-hidden="true" />
      <div className="auth-hero-glow" aria-hidden="true" />

      <div className="auth-split-column relative z-10 w-full">
        <header className="auth-brand-header">
          <BrandLogo variant="auth" className="mb-0" />
        </header>

        <div className="auth-card-slot auth-hero-card-slot">
          <article className="auth-hero-card auth-hero-panel-card">
            <h2 className="text-[1.85rem] xl:text-[2.25rem] font-bold leading-[1.18] tracking-tight text-white mb-4">
              <span className="block text-base xl:text-lg font-medium text-white/75 mb-1.5">
                Welcome to
              </span>
              AtiSunya WebForm Builder
            </h2>

            <p className="text-[15px] xl:text-base text-white/90 leading-relaxed">
              Create, manage, and streamline business processes with secure, configurable web forms.
            </p>

            <div className="auth-hero-divider my-7 xl:my-8" aria-hidden="true" />

            <ul className="grid gap-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li
                  key={title}
                  className="auth-hero-feature flex gap-4 rounded-xl px-4 py-3.5"
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1"
                    style={{
                      backgroundColor: `${AUTH_PRIMARY}33`,
                      borderColor: `${AUTH_PRIMARY_LIGHT}44`,
                      boxShadow: `inset 0 0 0 1px ${AUTH_PRIMARY_LIGHT}33`,
                    }}
                  >
                    <Icon size={19} style={{ color: AUTH_PRIMARY_LIGHT }} strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-[15px] font-semibold text-white leading-snug">{title}</p>
                    <p className="text-[13px] text-white/80 leading-relaxed mt-1.5">{text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-8 text-sm text-white/75 leading-relaxed">
              Trusted by teams who need fast, compliant form workflows.{' '}
              <Link
                to={AUTH_ROUTES.security}
                className="font-semibold underline underline-offset-4 decoration-white/40 hover:decoration-[#8eb4c4] transition-colors"
                style={{ color: AUTH_PRIMARY_LIGHT }}
              >
                Security overview
              </Link>
            </p>
          </article>
        </div>
      </div>
    </aside>
  );
}
