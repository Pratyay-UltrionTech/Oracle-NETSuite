import { Link } from 'react-router-dom';
import { LayoutTemplate, GitBranch, RefreshCw, Library, ArrowRight } from 'lucide-react';
import { LegalPageLayout } from '../../components/layout/LegalPageLayout';
import { AUTH_ROUTES } from '../../config/authRoutes';

const FEATURES = [
  {
    icon: LayoutTemplate,
    title: 'Visual form builder',
    desc: 'Drag fields from a NetSuite-aligned catalogue onto purchase orders, vendor bills, and custom transactions.',
  },
  {
    icon: Library,
    title: 'Master data catalogues',
    desc: 'Vendors, items, accounts, locations, and more — pulled live from NetSuite or maintained centrally.',
  },
  {
    icon: GitBranch,
    title: 'Approval workflows',
    desc: 'Multi-level routing so the right managers review submissions before anything hits your ERP.',
  },
  {
    icon: RefreshCw,
    title: 'Real-time sync',
    desc: 'Approved forms push directly into NetSuite with status tracking and error visibility.',
  },
];

export default function ExplorePage() {
  return (
    <LegalPageLayout title="Explore the Builder">
      <p>
        Atisunya WebForm Builder helps finance and operations teams replace manual spreadsheets with
        governed, NetSuite-connected forms — without writing code.
      </p>

      <div className="grid sm:grid-cols-2 gap-3 pt-2">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-lg border border-[#e8e8e8] bg-white p-4">
            <div className="w-9 h-9 rounded-md bg-[#305c73]/10 flex items-center justify-center mb-2">
              <Icon size={18} className="text-[#305c73]" />
            </div>
            <p className="text-[13px] font-semibold text-[#222] mb-1">{title}</p>
            <p className="text-[11px] text-[#666] leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <div className="pt-4">
        <Link
          to={AUTH_ROUTES.login}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#33667a] text-white text-[13px] font-semibold rounded-[5px] hover:bg-[#2a5566] transition-colors"
        >
          Sign in to get started
          <ArrowRight size={16} />
        </Link>
      </div>
    </LegalPageLayout>
  );
}
