import { useState } from 'react';
import { HardHat, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { USERS } from '../context/mockData';

export default function LoginPage() {
  const { login, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(username, password);
      setLoading(false);
    }, 300);
  };

  const quickLogin = (u) => {
    setUsername(u.username);
    setPassword(u.password);
  };

  const roleColors = {
    MD: 'bg-purple-100 text-purple-700',
    Admin: 'bg-slate-100 text-slate-700',
    ProcurementManager: 'bg-orange-100 text-orange-700',
    PM: 'bg-blue-100 text-blue-700',
    CM: 'bg-cyan-100 text-cyan-700',
    StoreMain: 'bg-indigo-100 text-indigo-700',
    StoreSite: 'bg-teal-100 text-teal-700',
    Supervisor: 'bg-green-100 text-green-700',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Branding */}
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl shadow-2xl mb-6">
            <HardHat size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Construction ERP</h1>
          <p className="text-xl text-blue-300 font-medium mb-2">Multi-Project Tool Store</p>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            Enterprise management system for construction equipment across all project sites. Track, borrow, repair, and write-off tools with full audit trail.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 max-w-sm">
            {[
              { label: 'Total Tools', value: '25+' },
              { label: 'Active Sites', value: '3' },
              { label: 'User Roles', value: '8' },
              { label: 'Workflows', value: '7' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Sign In</h2>
          <p className="text-slate-500 text-sm mb-6">Access your project management portal</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                  placeholder="Enter password"
                  required
                />
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <LogIn size={18} />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Quick access demo accounts */}
          <div className="mt-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Demo Accounts (click to fill)</p>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto scrollbar-thin pr-1">
              {USERS.map(u => (
                <button
                  key={u.id}
                  onClick={() => quickLogin(u)}
                  className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {u.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{u.username}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleColors[u.role] || 'bg-slate-100 text-slate-600'}`}>
                      {u.role}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
