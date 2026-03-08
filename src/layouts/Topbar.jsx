import { Menu, Bell, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useState } from 'react';
import { clsx } from 'clsx';

export default function Topbar({ onMenuClick, pageTitle }) {
  const { currentUser, logout } = useAuth();
  const { writeOffRequests, requests } = useApp();
  const [showProfile, setShowProfile] = useState(false);

  const notifications = [
    ...writeOffRequests.filter(w => w.status === 'Pending').map(w => ({ type: 'writeoff', msg: `Write-off pending: ${w.toolName}`, color: 'text-orange-600' })),
    ...requests.filter(r => r.status === 'Pending').map(r => ({ type: 'request', msg: `Request pending: ${r.id}`, color: 'text-blue-600' })),
  ].slice(0, 8);

  const [showNotif, setShowNotif] = useState(false);

  const roleColors = {
    SuperAdmin: 'bg-violet-600',
    MD: 'bg-purple-600',
    Admin: 'bg-slate-600',
    ProcurementManager: 'bg-orange-500',
    PM: 'bg-blue-600',
    CM: 'bg-cyan-600',
    StoreMain: 'bg-indigo-600',
    StoreSite: 'bg-teal-600',
    Supervisor: 'bg-green-600',
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0 no-print">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-800">{pageTitle}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotif(s => !s); setShowProfile(false); }}
            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-700">Notifications ({notifications.length})</p>
              </div>
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">All clear!</p>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((n, i) => (
                    <div key={i} className="px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50">
                      <p className={clsx('text-xs font-medium', n.color)}>{n.msg}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile */}
        {currentUser && (
          <div className="relative">
            <button
              onClick={() => { setShowProfile(s => !s); setShowNotif(false); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className={clsx('w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center', roleColors[currentUser.role] || 'bg-slate-500')}>
                {currentUser.avatar}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-slate-700 leading-tight">{currentUser.name}</p>
                <p className="text-xs text-slate-400">{(currentUser.roles || [currentUser.role]).join(', ')}</p>
              </div>
              <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
            </button>
            {showProfile && (
              <div className="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-700">{currentUser.name}</p>
                  <p className="text-xs text-slate-400">{(currentUser.roles || [currentUser.role]).join(', ')} · {currentUser.siteId}</p>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
