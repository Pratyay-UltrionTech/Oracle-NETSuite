import * as React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import {
  Home,
  LogOut,
  Bell,
  Building,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  PackageCheck,
  FileStack,
  ArrowUpRight,
  Settings,
  UserCircle,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSidebarExpanded } from '../../lib/useSidebarExpanded';
import { StatusBadge } from '../admin';

type NavItem = { name: string; icon: React.ElementType; path: string };

function NavLink({
  item,
  isActive,
  isExpanded,
}: {
  item: NavItem;
  isActive: boolean;
  isExpanded: boolean;
}) {
  return (
    <Link
      to={item.path}
      className={cn(
        'flex items-center rounded-ns-md text-sm font-medium transition-all whitespace-nowrap overflow-hidden',
        isExpanded ? 'px-3 py-2.5 gap-3' : 'px-0 py-2.5 justify-center',
        isActive
          ? 'bg-ns-blue-soft text-ns-blue'
          : 'text-ns-text-muted hover:text-ns-text hover:bg-ns-page-bg',
      )}
      title={!isExpanded ? item.name : ''}
    >
      <item.icon size={18} className={cn('flex-shrink-0', isActive ? 'text-ns-blue' : 'text-ns-text-muted')} />
      <span className={cn('transition-all duration-300', isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden')}>
        {item.name}
      </span>
    </Link>
  );
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, companies = [] } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { isExpanded, toggle: toggleSidebar } = useSidebarExpanded('customer-sidebar-expanded');

  const company = user?.companyId ? companies.find(c => c.id === user.companyId) : null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const mainNav: NavItem[] = [{ name: 'Overview', icon: Home, path: '/customer-dashboard' }];
  const transactionNav: NavItem[] = [
    { name: 'Purchase Orders', icon: ShoppingBag, path: '/user/po' },
    { name: 'Sales Orders', icon: TrendingUp, path: '/user/so' },
    { name: 'Accounts Payable', icon: CreditCard, path: '/user/ap' },
    { name: 'Accounts Receivable', icon: ArrowUpRight, path: '/user/ar' },
    { name: 'Item Receipt', icon: PackageCheck, path: '/user/ir' },
    { name: 'Vendor Bills', icon: FileStack, path: '/user/vb' },
  ];
  const accountNav: NavItem[] = [{ name: 'Profile', icon: UserCircle, path: '/profile' }];

  const initials =
    user?.name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'U';

  const renderSection = (label: string, items: NavItem[]) => (
    <>
      <div
        className={cn(
          'pt-4 pb-2 text-[10px] font-semibold text-ns-text-muted uppercase tracking-[0.15em] px-3',
          isExpanded ? 'opacity-100' : 'opacity-0 h-0 pt-0 pb-0 overflow-hidden',
        )}
      >
        {label}
      </div>
      <div className="space-y-0.5">
        {items.map(item => (
          <NavLink
            key={item.path}
            item={item}
            isActive={location.pathname === item.path}
            isExpanded={isExpanded}
          />
        ))}
      </div>
    </>
  );

  return (
    <div className="h-screen bg-ns-page-bg flex overflow-hidden">
      <aside
        className={cn(
          'bg-ns-sidebar-bg h-screen flex-shrink-0 flex flex-col border-r border-ns-sidebar-border z-30 transition-all duration-300',
          isExpanded ? 'w-60' : 'w-16',
        )}
      >
        <div
          className={cn(
            'p-4 flex items-center border-b border-ns-sidebar-border',
            isExpanded ? 'justify-between gap-2' : 'justify-center',
          )}
        >
          {isExpanded && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 bg-status-approved rounded-ns-md flex items-center justify-center text-xs font-bold text-white">
                VP
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-ns-text truncate">Vendor Hub</p>
                <p className="text-[10px] text-ns-text-muted truncate">Powered by NS Portal</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded-ns-md text-ns-text-muted hover:text-ns-text hover:bg-ns-page-bg transition-colors"
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isExpanded ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto custom-scrollbar">
          {renderSection('My account', mainNav)}
          {renderSection('Transactions', transactionNav)}
          {renderSection('Help', accountNav)}
        </nav>

        <div className="p-3 border-t border-ns-sidebar-border">
          <div className={cn('flex items-center mb-3', isExpanded ? 'gap-2.5 px-1' : 'justify-center')}>
            <div className="w-8 h-8 rounded-full bg-status-approved text-white flex items-center justify-center text-xs font-semibold">
              {initials}
            </div>
            {isExpanded && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ns-text truncate">{user?.name}</p>
                <p className="text-[10px] text-ns-text-muted truncate">{user?.companyName}</p>
              </div>
            )}
          </div>
          {(user?.role === 'super_admin' || user?.role === 'client_admin') && (
            <button
              onClick={() => navigate('/dashboard')}
              className={cn(
                'w-full flex items-center text-ns-blue hover:bg-ns-blue-soft transition-all rounded-ns-md text-xs font-medium mb-2',
                isExpanded ? 'gap-2 py-2 px-3' : 'justify-center py-2',
              )}
            >
              <Settings size={14} />
              {isExpanded && <span>Admin console</span>}
            </button>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center text-ns-text-muted hover:text-ns-text hover:bg-ns-page-bg transition-all rounded-ns-md text-xs font-medium',
              isExpanded ? 'gap-2 py-2 px-3' : 'justify-center py-2',
            )}
          >
            <LogOut size={14} />
            {isExpanded && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-ns-border flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {!isExpanded && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-2 rounded-ns-md text-ns-text-muted hover:text-ns-blue hover:bg-ns-blue-soft transition-colors"
                aria-label="Expand sidebar"
              >
                <PanelLeft size={18} />
              </button>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-ns-page-bg rounded-ns-md border border-ns-border">
              <Building size={14} className="text-ns-blue" />
              <span className="text-xs font-medium text-ns-text">{company?.name || user?.companyName || 'My company'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 text-ns-text-muted hover:text-ns-text hover:bg-ns-page-bg rounded-ns-md transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-pending rounded-full border-2 border-white" />
            </button>
            <StatusBadge variant="synced" dot className="hidden sm:inline-flex">
              NetSuite Live
            </StatusBadge>
            <Link
              to="/profile"
              className="w-8 h-8 rounded-full bg-status-approved text-white flex items-center justify-center text-xs font-semibold"
            >
              {initials}
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-ns-page-bg custom-scrollbar">
          <div className="max-w-[1400px] mx-auto p-6 lg:p-8 animate-in fade-in duration-300">{children}</div>
        </main>
      </div>
    </div>
  );
}
