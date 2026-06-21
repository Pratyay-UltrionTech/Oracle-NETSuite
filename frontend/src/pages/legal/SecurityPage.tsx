import { Link } from 'react-router-dom';
import { Shield, KeyRound, FileSearch, Lock, ArrowRight } from 'lucide-react';
import { LegalPageLayout } from '../../components/layout/LegalPageLayout';
import { AUTH_ROUTES } from '../../config/authRoutes';

const SECURITY_POINTS = [
  {
    icon: KeyRound,
    title: 'Role-based access control',
    desc: 'Super Admin, Client Admin, Manager, and User roles limit who can build forms, approve submissions, or sync to NetSuite.',
  },
  {
    icon: Lock,
    title: 'Secure authentication',
    desc: 'Passwords are hashed server-side. Sessions use signed tokens. Password reset flows use time-limited email links.',
  },
  {
    icon: FileSearch,
    title: 'Audit trails',
    desc: 'Submission history, approval steps, and sync outcomes are recorded so your team can trace every transaction.',
  },
  {
    icon: Shield,
    title: 'Data protection',
    desc: 'Company data is isolated by tenant. Production traffic is served over HTTPS with encrypted credentials in transit.',
  },
];

export default function SecurityPage() {
  return (
    <LegalPageLayout title="Enterprise Security">
      <p>
        Atisunya WebForm Builder is designed for organizations that need governed access to ERP transactions.
        Security is built into authentication, permissions, and every stage of the submission lifecycle.
      </p>

      <ul className="space-y-3 pt-2">
        {SECURITY_POINTS.map(({ icon: Icon, title, desc }) => (
          <li key={title} className="flex gap-3 rounded-lg border border-[#e8e8e8] bg-white p-4">
            <div className="w-9 h-9 shrink-0 rounded-md bg-[#fce8e8] flex items-center justify-center">
              <Icon size={18} className="text-[#c0392b]" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#222] mb-0.5">{title}</p>
              <p className="text-[11px] text-[#666] leading-relaxed">{desc}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-3 pt-4">
        <Link
          to={AUTH_ROUTES.privacy}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8f8172] text-white text-[13px] font-semibold rounded-[5px] hover:bg-[#7d7164] transition-colors"
        >
          Read privacy policy
          <ArrowRight size={16} />
        </Link>
        <Link
          to={AUTH_ROUTES.status}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#33667a] text-[#33667a] text-[13px] font-semibold rounded-[5px] hover:bg-[#33667a]/5 transition-colors"
        >
          View system status
        </Link>
      </div>
    </LegalPageLayout>
  );
}
