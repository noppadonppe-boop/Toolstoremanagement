import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Package, ClipboardList, CalendarCheck,
  ArrowLeftRight, Wrench, AlertTriangle, HardHat, ChevronRight,
  X, Shield, FolderKanban
} from 'lucide-react';
import { useAuth, ROLE_PERMISSIONS } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

const MAIN_NAV = [
  { to: '/',             label: 'Dashboard',         icon: LayoutDashboard, module: 'dashboard' },
  { to: '/inventory',    label: 'Inventory',         icon: Package,         module: 'inventory' },
  { to: '/requisitions', label: 'Requisitions',      icon: ClipboardList,   module: 'requisitions' },
  { to: '/booking',      label: 'Daily Booking',     icon: CalendarCheck,   module: 'booking' },
  { to: '/borrow',       label: 'Inter-Site Borrow', icon: ArrowLeftRight,  module: 'borrow' },
  { to: '/repairs',      label: 'Repairs',           icon: Wrench,          module: 'repairs' },
  { to: '/writeoff',     label: 'Write-off',         icon: AlertTriangle,   module: 'writeoff' },
];

const ADMIN_NAV = [
  { to: '/projects',    label: 'โครงการ',           icon: FolderKanban,    module: 'projects' },
  { to: '/admin',       label: 'Admin Panel',       icon: Shield,          module: 'admin' },
];

export default function Sidebar({ open, onClose }) {
  const { currentUser, hasPermission } = useAuth();
  const { writeOffRequests, requests, repairs } = useApp();

  const pendingWriteOffs = writeOffRequests.filter(w => w.status === 'Pending').length;
  const pendingRequests = requests.filter(r => r.status === 'Pending').length;
  const pendingRepairs = repairs.filter(r => r.status === 'Pending').length;

  const badges = {
    '/writeoff': pendingWriteOffs,
    '/requisitions': pendingRequests,
    '/repairs': pendingRepairs,
  };

  const mainItems = MAIN_NAV.filter(n => hasPermission(n.module));
  const adminItems = ADMIN_NAV.filter(n => hasPermission(n.module));

  const roleColors = {
    SuperAdmin: 'bg-violet-100 text-violet-700',
    MD: 'bg-purple-100 text-purple-700',
    Admin: 'bg-slate-200 text-slate-700',
    ProcurementManager: 'bg-orange-100 text-orange-700',
    PM: 'bg-blue-100 text-blue-700',
    CM: 'bg-cyan-100 text-cyan-700',
    StoreMain: 'bg-indigo-100 text-indigo-700',
    StoreSite: 'bg-teal-100 text-teal-700',
    Supervisor: 'bg-green-100 text-green-700',
  };

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed top-0 left-0 h-full w-64 bg-slate-900 text-white z-40 flex flex-col transition-transform duration-300',
        'lg:translate-x-0 lg:static lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <HardHat size={20} />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">Construction ERP</p>
              <p className="text-xs text-slate-400">Tool Store System</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-slate-700 rounded-lg text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* User Info */}
        {currentUser && (
          <div className="mx-4 mt-4 p-3 bg-slate-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={clsx('w-9 h-9 rounded-full flex items-center justify-center overflow-hidden shrink-0', typeof currentUser.avatar === 'string' && currentUser.avatar.startsWith('http') ? 'bg-slate-700' : 'bg-blue-500 text-xs font-bold')}>
                {typeof currentUser.avatar === 'string' && currentUser.avatar.startsWith('http') ? (
                  <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  currentUser.avatar
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{currentUser.name}</p>
                <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-medium', roleColors[currentUser.role] || 'bg-slate-700 text-slate-300')}>
                  {(currentUser.roles || [currentUser.role]).join(' · ')}
                </span>
              </div>
            </div>
            {currentUser.siteId !== 'HQ' && (
              <p className="text-xs text-slate-400 mt-2 pl-0.5">📍 {currentUser.siteId}</p>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {mainItems.map(({ to, label, icon: Icon }) => {
            const badge = badges[to];
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={onClose}
                className={({ isActive }) => clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group',
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon size={18} className="shrink-0" />
                <span className="flex-1">{label}</span>
                {badge > 0 && (
                  <span className="min-w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center px-1.5 font-bold">
                    {badge}
                  </span>
                )}
                <ChevronRight size={14} className="text-slate-500 group-hover:text-slate-300 shrink-0" />
              </NavLink>
            );
          })}

          {/* Admin section separator */}
          {adminItems.length > 0 && (
            <>
              <div className="flex items-center gap-2 px-3 pt-4 pb-1">
                <div className="flex-1 h-px bg-slate-700/60" />
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Admin</span>
                <div className="flex-1 h-px bg-slate-700/60" />
              </div>
              {adminItems.map(({ to, label, icon: Icon }) => {
                const badge = badges[to];
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    onClick={onClose}
                    className={({ isActive }) => clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group',
                      isActive
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="flex-1">{label}</span>
                    {badge > 0 && (
                      <span className="min-w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center px-1.5 font-bold">
                        {badge}
                      </span>
                    )}
                    <ChevronRight size={14} className="text-slate-500 group-hover:text-slate-300 shrink-0" />
                  </NavLink>
                );
              })}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-700/50">
          <p className="text-xs text-slate-500 text-center">v1.0.0 · Construction ERP</p>
          <p className="text-[10px] text-slate-600 text-center mt-1">อัปเดตแบบเรียลไทม์</p>
        </div>
      </aside>
    </>
  );
}
